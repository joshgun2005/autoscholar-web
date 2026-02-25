import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Clock, Percent, Activity } from "lucide-react";

interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface OptionResult {
  price: number;
  intrinsic_value: number;
  time_value: number;
  greeks: OptionGreeks;
  moneyness: string;
}

interface OptionsPricingData {
  parameters: {
    stock_price: number;
    strike_price: number;
    time_to_maturity: number;
    risk_free_rate: number;
    volatility: number;
    option_type: string;
  };
  call_option: OptionResult;
  put_option: OptionResult;
  parity_check: {
    call_minus_put: number;
    stock_minus_pv_strike: number;
    parity_holds: boolean;
  };
}

interface OptionsPricingCardProps {
  data: OptionsPricingData;
}

export function OptionsPricingCard({ data }: OptionsPricingCardProps) {
  const formatPrice = (value: number) => `$${value.toFixed(4)}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatGreek = (value: number, decimals: number = 4) => value.toFixed(decimals);

  const getMoneynessColor = (moneyness: string) => {
    switch (moneyness) {
      case 'ITM':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ATM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'OTM':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const GreekIndicator = ({ label, value, tooltip }: { label: string; value: number; tooltip: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground/60" title={tooltip}>ⓘ</span>
      </div>
      <span className={`text-sm font-semibold ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {formatGreek(value)}
      </span>
    </div>
  );

  const OptionCard = ({ title, option, icon }: { title: string; option: OptionResult; icon: React.ReactNode }) => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge className={getMoneynessColor(option.moneyness)}>
            {option.moneyness}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Option Price */}
        <div className="p-4 bg-primary/5 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Option Price</div>
          <div className="text-3xl font-bold text-primary">{formatPrice(option.price)}</div>
        </div>

        {/* Value Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Intrinsic</div>
            <div className="text-lg font-semibold">{formatPrice(option.intrinsic_value)}</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Time Value</div>
            <div className="text-lg font-semibold">{formatPrice(option.time_value)}</div>
          </div>
        </div>

        {/* Greeks */}
        <div className="pt-2">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Greeks (Sensitivities)
          </div>
          <div className="space-y-1">
            <GreekIndicator
              label="Delta (Δ)"
              value={option.greeks.delta}
              tooltip="Change in option price for $1 change in stock price"
            />
            <GreekIndicator
              label="Gamma (Γ)"
              value={option.greeks.gamma}
              tooltip="Rate of change of Delta"
            />
            <GreekIndicator
              label="Theta (Θ)"
              value={option.greeks.theta}
              tooltip="Time decay - change in price per day"
            />
            <GreekIndicator
              label="Vega (ν)"
              value={option.greeks.vega}
              tooltip="Change in price for 1% change in volatility"
            />
            <GreekIndicator
              label="Rho (ρ)"
              value={option.greeks.rho}
              tooltip="Change in price for 1% change in interest rate"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Parameters Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Black-Scholes Option Pricing
          </CardTitle>
          <CardDescription>Theoretical option values and Greeks for European options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Stock Price</div>
              <div className="text-lg font-semibold">{formatPrice(data.parameters.stock_price)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Strike Price</div>
              <div className="text-lg font-semibold">{formatPrice(data.parameters.strike_price)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time to Expiry
              </div>
              <div className="text-lg font-semibold">{data.parameters.time_to_maturity.toFixed(4)} yr</div>
              <div className="text-xs text-muted-foreground">{(data.parameters.time_to_maturity * 365).toFixed(0)} days</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Volatility
              </div>
              <div className="text-lg font-semibold">{formatPercent(data.parameters.volatility)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Risk-Free Rate</div>
              <div className="text-lg font-semibold">{formatPercent(data.parameters.risk_free_rate)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call and Put Options Side by Side */}
      <div className="grid md:grid-cols-2 gap-4">
        <OptionCard
          title="Call Option"
          option={data.call_option}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
        />
        <OptionCard
          title="Put Option"
          option={data.put_option}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
        />
      </div>

      {/* Put-Call Parity Check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Put-Call Parity Verification</CardTitle>
          <CardDescription className="text-xs">
            Verifies that C - P = S - K×e^(-rT)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Call - Put</div>
              <div className="text-sm font-semibold">{formatPrice(data.parity_check.call_minus_put)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">S - PV(K)</div>
              <div className="text-sm font-semibold">{formatPrice(data.parity_check.stock_minus_pv_strike)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Parity Check</div>
              <Badge variant={data.parity_check.parity_holds ? "default" : "destructive"}>
                {data.parity_check.parity_holds ? '✓ Holds' : '✗ Failed'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
