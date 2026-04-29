import { ControlTowerHealth } from "./control-tower/ControlTowerHealth";
import { ControlTowerTrends } from "./control-tower/ControlTowerTrends";
import { ControlTowerLearning } from "./control-tower/ControlTowerLearning";
import { ControlTowerQueue } from "./control-tower/ControlTowerQueue";
import { ControlTowerImpact } from "./control-tower/ControlTowerImpact";
import { Brain } from "lucide-react";

export function ContactCenterControlTower() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">Autonomous AI Control Tower</h2>
          <p className="text-xs text-[#6B7280]">Real-time AI performance, learning progress, and business impact</p>
        </div>
      </div>

      {/* Section 1: Health Overview */}
      <section>
        <h3 className="text-sm font-semibold text-[#374151] mb-3 uppercase tracking-wider">AI Health Overview</h3>
        <ControlTowerHealth />
      </section>

      {/* Section 2: Trends */}
      <section>
        <h3 className="text-sm font-semibold text-[#374151] mb-3 uppercase tracking-wider">Performance Trends</h3>
        <ControlTowerTrends />
      </section>

      {/* Section 3: Optimization Queue */}
      <section>
        <h3 className="text-sm font-semibold text-[#374151] mb-3 uppercase tracking-wider">Optimization Queue</h3>
        <ControlTowerQueue />
      </section>

      {/* Section 4: Learning Performance */}
      <section>
        <h3 className="text-sm font-semibold text-[#374151] mb-3 uppercase tracking-wider">Learning Performance</h3>
        <ControlTowerLearning />
      </section>

      {/* Section 5: Business Impact */}
      <section>
        <h3 className="text-sm font-semibold text-[#374151] mb-3 uppercase tracking-wider">Business Impact (30 Days)</h3>
        <ControlTowerImpact />
      </section>
    </div>
  );
}
