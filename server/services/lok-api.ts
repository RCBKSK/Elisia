import fetch from 'node-fetch';

// Land IDs from Elisia Land Program configuration
const ALL_LAND_IDS = [
  "134378", "135682", "145933", "134152", "137752"
];

export interface LokContribution {
  kingdomId: string;
  total: number;
  name: string;
  continent: number;
  date: string; // Start date of the 7-day period
  landId?: string; // Land ID this contribution came from
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ContributionResult {
  data: LokContribution[];
  from: string;
  to: string;
}

/**
 * Helper function to format a Date object to 'YYYY-MM-DD' string.
 */
function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper function to create a Date object from YYYY-MM-DD string in UTC.
 */
function createDateFromYYYYMMDD(dateString: string): Date {
  const parts = dateString.split('-').map(Number);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

/**
 * Generates 7-day date chunks (Sunday-Saturday) that cover the entire requested period.
 */
function getLokApiCompatibleDateChunks(overallFromDateUTC: Date, overallToDateUTC: Date): Array<{ from: string; to: string }> {
  const chunks = [];
  
  let currentChunkStart = new Date(overallFromDateUTC.getTime());
  let lastValidSaturday = new Date(overallToDateUTC.getTime());

  // Adjust currentChunkStart to the most recent Sunday (UTC)
  const dayOfWeekOfOverallFrom = currentChunkStart.getUTCDay();
  if (dayOfWeekOfOverallFrom !== 0) {
    currentChunkStart.setUTCDate(currentChunkStart.getUTCDate() - dayOfWeekOfOverallFrom);
  }
  currentChunkStart.setUTCHours(0, 0, 0, 0);

  // Adjust lastValidSaturday to the next Saturday (UTC) if it's not already Saturday
  const dayOfWeekOfOverallTo = lastValidSaturday.getUTCDay();
  if (dayOfWeekOfOverallTo !== 6) {
    lastValidSaturday.setUTCDate(lastValidSaturday.getUTCDate() + (6 - dayOfWeekOfOverallTo));
  }
  lastValidSaturday.setUTCHours(0, 0, 0, 0);

  // Loop, adding 7 days at a time, creating Sunday-Saturday chunks
  while (currentChunkStart.getTime() <= lastValidSaturday.getTime()) {
    let currentChunkEnd = new Date(currentChunkStart.getTime());
    currentChunkEnd.setUTCDate(currentChunkStart.getUTCDate() + 6);
    currentChunkEnd.setUTCHours(0, 0, 0, 0);

    chunks.push({
      from: formatDate(currentChunkStart),
      to: formatDate(currentChunkEnd)
    });

    // Move to the next 7-day period (next Sunday UTC)
    currentChunkStart.setUTCDate(currentChunkStart.getUTCDate() + 7);
  }

  console.log(`Generated LOK API date chunks for overall range ${formatDate(overallFromDateUTC)} to ${formatDate(overallToDateUTC)}:`, chunks);
  return chunks;
}

/**
 * Fetches land contribution data from the League of Kingdoms API for given land IDs and period.
 */
async function getLokContributionData(overallFromDateUTC: Date, overallToDateUTC: Date): Promise<LokContribution[]> {
  let allContributions: LokContribution[] = [];

  console.log(`[getLokContributionData] Overall requested period (UTC): ${formatDate(overallFromDateUTC)} to ${formatDate(overallToDateUTC)}`);

  const dateChunks = getLokApiCompatibleDateChunks(overallFromDateUTC, overallToDateUTC);

  for (const chunk of dateChunks) {
    for (const landId of ALL_LAND_IDS) {
      const apiUrl = `https://api-lok-live.leagueofkingdoms.com/api/stat/land/contribution?landId=${landId}&from=${chunk.from}&to=${chunk.to}`;
      
      try {
        const response = await fetch(apiUrl);
        const responseCode = response.status;
        const content = await response.text();

        if (responseCode === 200) {
          try {
            const jsonData = JSON.parse(content);
            
            if (jsonData && jsonData.contribution && Array.isArray(jsonData.contribution)) {
              let validItemsInChunk = 0;
              jsonData.contribution.forEach((item: any) => {
                if (item && typeof item === 'object' && typeof item.total === 'number' && item.kingdomId) {
                  // Inject the 'date' property from the current chunk's 'from' date
                  item.date = chunk.from;
                  allContributions.push({
                    kingdomId: String(item.kingdomId),
                    total: item.total,
                    name: String(item.name || "Unknown Kingdom"),
                    continent: Number(item.continent || 0),
                    date: item.date,
                    landId: landId
                  });
                  validItemsInChunk++;
                } else {
                  console.warn(`Invalid item for landId ${landId}, chunk ${chunk.from} to ${chunk.to}:`, item);
                }
              });
              console.log(`LOK API Success for landId: ${landId}, chunk: ${chunk.from} to ${chunk.to}. Valid items: ${validItemsInChunk}`);
            } else {
              const errorDetails = jsonData && jsonData.err && jsonData.err.code ? `Error Code: ${jsonData.err.code}` : 'No specific error code.';
              console.log(`LOK API (landId: ${landId}, chunk: ${chunk.from} to ${chunk.to}) returned no contribution data. ${errorDetails}`);
            }
          } catch (jsonError: any) {
            console.error(`JSON parsing error for landId ${landId}, chunk ${chunk.from} to ${chunk.to}:`, jsonError.message);
          }
        } else {
          console.error(`LOK API (landId: ${landId}, chunk: ${chunk.from} to ${chunk.to}) returned status ${responseCode}: ${content}`);
        }
      } catch (fetchError: any) {
        console.error(`Error fetching data for landId ${landId}, chunk ${chunk.from} to ${chunk.to}:`, fetchError.message);
      }
    }
  }

  console.log(`Total raw contributions collected: ${allContributions.length} items`);

  // Filter contributions based on whether their 7-day period overlaps with the overall requested period
  const filteredToOverallRange = allContributions.filter(item => {
    if (!item || !item.date || typeof item.total !== 'number') {
      return false;
    }

    const itemWeekStart = createDateFromYYYYMMDD(item.date);
    const itemWeekEnd = new Date(itemWeekStart.getTime());
    itemWeekEnd.setUTCDate(itemWeekStart.getUTCDate() + 6);
    itemWeekEnd.setUTCHours(0, 0, 0, 0);

    // Overlap condition
    const isOverlapping = itemWeekStart.getTime() <= overallToDateUTC.getTime() && 
                         overallFromDateUTC.getTime() <= itemWeekEnd.getTime();

    return isOverlapping;
  });

  console.log(`Total contributions after filtering: ${filteredToOverallRange.length} items`);
  return filteredToOverallRange;
}

/**
 * Calculate date ranges based on period selection.
 */
export function calculateDates(period: string, customDays?: number): DateRange {
  const now = new Date();
  const currentYearUTC = now.getUTCFullYear();
  const currentMonthUTC = now.getUTCMonth();
  const currentDayUTC = now.getUTCDate();
  const currentDayOfWeekUTC = now.getUTCDay();

  const yesterdayUTC = new Date(Date.UTC(currentYearUTC, currentMonthUTC, currentDayUTC - 1));

  let fromDateUTC = new Date();
  let toDateUTC = new Date(yesterdayUTC.getTime());

  console.log(`[calculateDates] Calculating dates for period: ${period}, customDays: ${customDays}`);

  switch (period) {
    case 'currentMonth':
      fromDateUTC = new Date(Date.UTC(currentYearUTC, currentMonthUTC, 1));
      toDateUTC = new Date(yesterdayUTC.getTime());
      break;
    case 'lastMonth':
      fromDateUTC = new Date(Date.UTC(currentYearUTC, currentMonthUTC - 1, 1));
      toDateUTC = new Date(Date.UTC(currentYearUTC, currentMonthUTC, 0));
      break;
    case 'currentWeek':
      fromDateUTC = new Date(Date.UTC(currentYearUTC, currentMonthUTC, currentDayUTC - currentDayOfWeekUTC));
      toDateUTC = new Date(yesterdayUTC.getTime());
      break;
    case 'lastWeek':
      fromDateUTC = new Date(Date.UTC(currentYearUTC, currentMonthUTC, currentDayUTC - currentDayOfWeekUTC - 7));
      toDateUTC = new Date(fromDateUTC.getTime());
      toDateUTC.setUTCDate(fromDateUTC.getUTCDate() + 6);
      break;
    case 'last2Weeks':
      fromDateUTC = new Date(yesterdayUTC.getTime());
      fromDateUTC.setUTCDate(yesterdayUTC.getUTCDate() - 13);
      toDateUTC = new Date(yesterdayUTC.getTime());
      break;
    case 'last3Weeks':
      fromDateUTC = new Date(yesterdayUTC.getTime());
      fromDateUTC.setUTCDate(yesterdayUTC.getUTCDate() - 20);
      toDateUTC = new Date(yesterdayUTC.getTime());
      break;
    case 'customDays':
      if (customDays && customDays > 0) {
        fromDateUTC = new Date(yesterdayUTC.getTime());
        fromDateUTC.setUTCDate(yesterdayUTC.getUTCDate() - customDays + 1);
        toDateUTC = new Date(yesterdayUTC.getTime());
      } else {
        // Default to 7 days
        fromDateUTC = new Date(yesterdayUTC.getTime());
        fromDateUTC.setUTCDate(yesterdayUTC.getUTCDate() - 6);
        toDateUTC = new Date(yesterdayUTC.getTime());
      }
      break;
    default:
      // Default to current week
      fromDateUTC = new Date(Date.UTC(currentYearUTC, currentMonthUTC, currentDayUTC - currentDayOfWeekUTC));
      toDateUTC = new Date(yesterdayUTC.getTime());
      break;
  }

  console.log(`[calculateDates] Range for period '${period}': From: ${formatDate(fromDateUTC)}, To: ${formatDate(toDateUTC)}`);
  return { from: fromDateUTC, to: toDateUTC };
}

/**
 * Fetches aggregated contributions for all users with registered kingdoms.
 */
export async function getAllUsersContributions(period: string, customDays?: number, userKingdomMap?: Map<string, string[]>): Promise<ContributionResult> {
  const { from: overallFromDateUTC, to: overallToDateUTC } = calculateDates(period, customDays);
  
  const allRawContributions = await getLokContributionData(overallFromDateUTC, overallToDateUTC);

  // For now, return all contributions - we'll aggregate by user on the frontend
  // In a real implementation, you'd use the userKingdomMap to aggregate by username
  const formattedData = allRawContributions.map(item => ({
    ...item,
    from: formatDate(overallFromDateUTC),
    to: formatDate(overallToDateUTC)
  }));

  return {
    data: formattedData,
    from: formatDate(overallFromDateUTC),
    to: formatDate(overallToDateUTC)
  };
}

/**
 * Fetches contributions for specific kingdom IDs (for user dashboard).
 */
export async function getContributionsForKingdoms(kingdomIds: string[], period: string, customDays?: number): Promise<ContributionResult> {
  const { from: overallFromDateUTC, to: overallToDateUTC } = calculateDates(period, customDays);
  
  const allRawContributions = await getLokContributionData(overallFromDateUTC, overallToDateUTC);
  
  const filteredData = allRawContributions.filter(item => kingdomIds.includes(item.kingdomId));

  const formattedData = filteredData.map(item => ({
    ...item,
    from: formatDate(overallFromDateUTC),
    to: formatDate(overallToDateUTC)
  }));

  return {
    data: formattedData,
    from: formatDate(overallFromDateUTC),
    to: formatDate(overallToDateUTC)
  };
}