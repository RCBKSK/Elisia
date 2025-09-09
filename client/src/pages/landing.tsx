import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 gaming-gradient rounded-full flex items-center justify-center">
              <i className="fas fa-crown text-2xl text-accent-foreground"></i>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Elisia Land Program</h2>
            <p className="text-muted-foreground">Land Development Management</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full gaming-gradient text-accent-foreground hover:opacity-90"
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Login to Continue
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account? Login will create one for you.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                New accounts require admin approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
