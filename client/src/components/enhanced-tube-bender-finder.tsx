import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, CheckCircle, AlertCircle, DollarSign, Wrench, Filter, Zap } from "lucide-react";
import { TubeBender } from "@shared/schema";
import ProductCard from "./product-card";

interface FilteredTubeBender extends TubeBender {
  score: number;
  reasons: string[];
  matchedCriteria: string[];
}

interface FinderCriteria {
  budget: number;
  maxDiameter: string;
  usaPreference: boolean;
  mandrelRequired: boolean;
  minBendAngle: number;
  wallThickness: string;
  dieShapes: string[];
  reliabilityImportant: boolean;
  modularClampingNeeded: boolean;
  sBendRequired: boolean;
  easeOfUse: string;
}

export default function EnhancedTubeBenderFinder() {
  const [step, setStep] = useState(1);
  const [criteria, setCriteria] = useState<FinderCriteria>({
    budget: 5000,
    maxDiameter: "",
    usaPreference: false,
    mandrelRequired: false,
    minBendAngle: 180,
    wallThickness: "",
    dieShapes: [],
    reliabilityImportant: false,
    modularClampingNeeded: false,
    sBendRequired: false,
    easeOfUse: ""
  });
  const [recommendations, setRecommendations] = useState<FilteredTubeBender[]>([]);

  const { data: allTubeBenders } = useQuery<TubeBender[]>({
    queryKey: ['/api/tube-benders']
  });

  const diameterOptions = [
    { value: "0.5", label: '1/2" (0.5")' },
    { value: "0.75", label: '3/4" (0.75")' },
    { value: "1", label: '1" (1.0")' },
    { value: "1.25", label: '1 1/4" (1.25")' },
    { value: "1.5", label: '1 1/2" (1.5")' },
    { value: "1.75", label: '1 3/4" (1.75")' },
    { value: "2", label: '2" (2.0")' },
    { value: "2.375", label: '2 3/8" (2.375")' },
    { value: "2.5", label: '2 1/2" (2.5")' },
    { value: "3", label: '3" (3.0")' }
  ];

  const wallThicknessOptions = [
    { value: "0.065", label: '.065" (16 gauge)' },
    { value: "0.083", label: '.083" (14 gauge)' },
    { value: "0.095", label: '.095" (12 gauge)' },
    { value: "0.120", label: '.120" (DOM tubing)' },
    { value: "0.156", label: '.156" (heavy wall)' },
    { value: "0.180", label: '.180" (extra heavy)' }
  ];

  const dieShapeOptions = [
    { value: "round", label: "Round Tubes" },
    { value: "square", label: "Square Tubes" },
    { value: "rectangle", label: "Rectangle Tubes" },
    { value: "hexagon", label: "Hexagon Tubes" },
    { value: "flat", label: "Flat Bar" },
    { value: "angle", label: "Angle Iron" }
  ];

  const easeOfUseOptions = [
    { value: "beginner", label: "Beginner Friendly", description: "Simple setup, clear instructions" },
    { value: "intermediate", label: "Some Experience OK", description: "Moderate learning curve" },
    { value: "advanced", label: "Professional Grade", description: "Complex but powerful features" }
  ];

  const findRecommendations = () => {
    if (!allTubeBenders) return;

    let filtered: FilteredTubeBender[] = allTubeBenders.map((bender: TubeBender) => {
      let score = 0;
      let reasons: string[] = [];
      let matchedCriteria: string[] = [];

      // 1. Budget filtering - IMPORTANT: Only eliminate if STARTING price exceeds budget
      const startingPrice = parseFloat(bender.priceMin || bender.priceRange.replace(/[$,]/g, '').split('-')[0]);
      if (startingPrice <= criteria.budget) {
        score += 20;
        matchedCriteria.push("Within Budget");
        if (startingPrice <= criteria.budget * 0.8) {
          score += 5;
          reasons.push(`Excellent value at $${startingPrice.toLocaleString()}`);
        }
      } else {
        // Eliminate completely if starting price exceeds budget
        return { ...bender, score: -100, reasons: [`Starting price $${startingPrice.toLocaleString()} exceeds budget`], matchedCriteria: [] } as FilteredTubeBender;
      }

      // 2. Diameter capacity
      if (criteria.maxDiameter) {
        const maxCapacity = parseFloat(bender.maxCapacity.replace(/[^0-9.]/g, ''));
        const requiredDiameter = parseFloat(criteria.maxDiameter);
        if (maxCapacity >= requiredDiameter) {
          score += 15;
          matchedCriteria.push("Diameter Capacity");
          if (maxCapacity >= requiredDiameter * 1.5) {
            score += 5;
            reasons.push("Handles larger tubes for future growth");
          }
        } else {
          return { ...bender, score: -100, reasons: [`Cannot handle ${criteria.maxDiameter}" diameter`], matchedCriteria: [] } as FilteredTubeBender;
        }
      }

      // 3. USA Manufacturing preference
      if (criteria.usaPreference) {
        if (bender.countryOfOrigin === "USA") {
          score += 15;
          matchedCriteria.push("Made in USA");
          reasons.push("American-made quality and support");
        } else {
          score -= 5; // Small penalty but don't eliminate
        }
      }

      // 4. Mandrel requirement
      if (criteria.mandrelRequired) {
        if (bender.mandrelBender === "Available" || bender.mandrelBender === "Standard") {
          score += 10;
          matchedCriteria.push("Mandrel Available");
        } else {
          return { ...bender, score: -100, reasons: ["No mandrel capability available"], matchedCriteria: [] } as FilteredTubeBender;
        }
      }

      // 5. Bend angle capability
      if (bender.bendAngle >= criteria.minBendAngle) {
        score += 10;
        matchedCriteria.push("Bend Angle");
        if (bender.bendAngle >= 195) {
          score += 3;
          reasons.push(`Exceptional ${bender.bendAngle}° bend capability`);
        }
      } else {
        score -= 8;
        reasons.push(`Limited to ${bender.bendAngle}° bends`);
      }

      // 6. Wall thickness capability
      if (criteria.wallThickness) {
        const requiredThickness = parseFloat(criteria.wallThickness);
        const benderCapacity = parseFloat(bender.wallThicknessCapacity || "0.120");
        if (benderCapacity >= requiredThickness) {
          score += 8;
          matchedCriteria.push("Wall Thickness");
        } else {
          score -= 5;
          reasons.push(`Limited wall thickness capability`);
        }
      }

      // 7. Die shapes compatibility
      if (criteria.dieShapes.length > 0) {
        // Simple check based on brand capabilities
        const hasVersatileDies = bender.brand === "RogueFab" || bender.brand === "Hossfeld";
        if (hasVersatileDies || criteria.dieShapes.includes("round")) {
          score += 8;
          matchedCriteria.push("Die Compatibility");
        }
      }

      // 8. Reliability/Years in business (brand-based scoring)
      if (criteria.reliabilityImportant) {
        const establishedBrands = ["JD2", "Hossfeld", "RogueFab"];
        if (establishedBrands.includes(bender.brand)) {
          score += 7;
          matchedCriteria.push("Established Brand");
          reasons.push("Proven reliability and support");
        }
      }

      // 9. Modular clamping system
      if (criteria.modularClampingNeeded) {
        if (bender.brand === "RogueFab") {
          score += 6;
          matchedCriteria.push("Modular Clamping");
          reasons.push("Advanced modular clamping system");
        } else {
          score -= 3;
        }
      }

      // 10. S-bend capability
      if (criteria.sBendRequired) {
        if (bender.sBendCapability) {
          score += 4;
          matchedCriteria.push("S-Bend Capable");
        } else {
          return { ...bender, score: -100, reasons: ["No S-bend capability"], matchedCriteria: [] } as FilteredTubeBender;
        }
      }

      // 11. Ease of use scoring
      if (criteria.easeOfUse) {
        if (criteria.easeOfUse === "beginner" && bender.brand === "RogueFab") {
          score += 8;
          matchedCriteria.push("Beginner Friendly");
          reasons.push("User-friendly design and setup");
        } else if (criteria.easeOfUse === "advanced" && (bender.category === "professional" || bender.brand === "RogueFab")) {
          score += 8;
          matchedCriteria.push("Professional Grade");
          reasons.push("Advanced features for professionals");
        } else if (criteria.easeOfUse === "intermediate") {
          score += 5;
          matchedCriteria.push("Moderate Complexity");
        }
      }

      return { ...bender, score, reasons, matchedCriteria } as FilteredTubeBender;
    });

    // Filter out eliminated options (negative scores)
    filtered = filtered.filter(bender => bender.score >= 0);

    // Sort by score and take top 3
    filtered.sort((a, b) => b.score - a.score);
    setRecommendations(filtered.slice(0, 3));
    setStep(5);
  };

  const resetFinder = () => {
    setStep(1);
    setCriteria({
      budget: 5000,
      maxDiameter: "",
      usaPreference: false,
      mandrelRequired: false,
      minBendAngle: 180,
      wallThickness: "",
      dieShapes: [],
      reliabilityImportant: false,
      modularClampingNeeded: false,
      sBendRequired: false,
      easeOfUse: ""
    });
    setRecommendations([]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Filter className="h-6 w-6" />
            Smart Tube Bender Finder
          </CardTitle>
          <CardDescription>
            Advanced filtering based on our scoring methodology to find your perfect match
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3, 4, 5].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= stepNum 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
              </div>
              {stepNum < 5 && (
                <ArrowRight className={`w-4 h-4 mx-2 ${
                  step > stepNum ? 'text-blue-600' : 'text-gray-400'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Budget & Diameter */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Budget & Diameter Requirements
            </CardTitle>
            <CardDescription>
              What's your maximum budget and largest tube diameter needed?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium">Maximum Budget (Starting Prices)</Label>
              <p className="text-sm text-gray-600 mb-2">
                Only options with starting prices within your budget will be shown
              </p>
              <div className="mt-2">
                <Slider
                  value={[criteria.budget]}
                  onValueChange={(values) => setCriteria({...criteria, budget: values[0]})}
                  max={10000}
                  min={1000}
                  step={500}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>$1,000</span>
                  <span className="font-medium text-blue-600">
                    ${criteria.budget.toLocaleString()}
                  </span>
                  <span>$10,000+</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Largest Tube Diameter Needed</Label>
              <Select value={criteria.maxDiameter} onValueChange={(value) => setCriteria({...criteria, maxDiameter: value})}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select tube diameter" />
                </SelectTrigger>
                <SelectContent>
                  {diameterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={() => setStep(2)} 
              disabled={!criteria.maxDiameter}
              className="w-full"
            >
              Next: Manufacturing & Features
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Manufacturing & Special Features */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Manufacturing & Special Features
            </CardTitle>
            <CardDescription>
              Select your preferences for manufacturing origin and special capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="usa-preference"
                  checked={criteria.usaPreference}
                  onCheckedChange={(checked) => setCriteria({...criteria, usaPreference: !!checked})}
                />
                <Label htmlFor="usa-preference" className="text-base">
                  Prefer USA Manufacturing
                </Label>

              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mandrel-required"
                  checked={criteria.mandrelRequired}
                  onCheckedChange={(checked) => setCriteria({...criteria, mandrelRequired: !!checked})}
                />
                <Label htmlFor="mandrel-required" className="text-base">
                  Mandrel Bending Required
                </Label>
                <Badge variant="outline">Required</Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="s-bend-required"
                  checked={criteria.sBendRequired}
                  onCheckedChange={(checked) => setCriteria({...criteria, sBendRequired: !!checked})}
                />
                <Label htmlFor="s-bend-required" className="text-base">
                  S-Bend Capability Required
                </Label>
                <Badge variant="outline">Required</Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="modular-clamping"
                  checked={criteria.modularClampingNeeded}
                  onCheckedChange={(checked) => setCriteria({...criteria, modularClampingNeeded: !!checked})}
                />
                <Label htmlFor="modular-clamping" className="text-base">
                  Modular Clamping System Needed
                </Label>
                <Badge variant="outline">Advanced</Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="reliability-important"
                  checked={criteria.reliabilityImportant}
                  onCheckedChange={(checked) => setCriteria({...criteria, reliabilityImportant: !!checked})}
                />
                <Label htmlFor="reliability-important" className="text-base">
                  Brand Reliability Very Important
                </Label>

              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Next: Specifications
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Technical Specifications */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Technical Specifications
            </CardTitle>
            <CardDescription>
              Specify your technical requirements for bend angle and wall thickness
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium">Minimum Bend Angle Required</Label>
              <div className="mt-2">
                <Slider
                  value={[criteria.minBendAngle]}
                  onValueChange={(values) => setCriteria({...criteria, minBendAngle: values[0]})}
                  max={200}
                  min={90}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>90°</span>
                  <span className="font-medium text-blue-600">
                    {criteria.minBendAngle}°
                  </span>
                  <span>200°</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Maximum Wall Thickness Needed</Label>
              <Select value={criteria.wallThickness} onValueChange={(value) => setCriteria({...criteria, wallThickness: value})}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select wall thickness (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {wallThicknessOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium">Die Shapes Needed (Optional)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {dieShapeOptions.map((shape) => (
                  <div key={shape.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={shape.value}
                      checked={criteria.dieShapes.includes(shape.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCriteria({...criteria, dieShapes: [...criteria.dieShapes, shape.value]});
                        } else {
                          setCriteria({...criteria, dieShapes: criteria.dieShapes.filter(s => s !== shape.value)});
                        }
                      }}
                    />
                    <Label htmlFor={shape.value} className="text-sm">
                      {shape.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Next: Experience Level
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Experience Level */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Experience Level</CardTitle>
            <CardDescription>
              How would you describe your tube bending experience?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              {easeOfUseOptions.map((option) => (
                <Card 
                  key={option.value}
                  className={`cursor-pointer border-2 transition-colors ${
                    criteria.easeOfUse === option.value 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCriteria({...criteria, easeOfUse: option.value})}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={findRecommendations} 
                disabled={!criteria.easeOfUse}
                className="flex-1"
              >
                Get Smart Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Smart Recommendations */}
      {step === 5 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Your Smart Recommendations</CardTitle>
              <CardDescription className="text-center">
                Based on {recommendations[0]?.matchedCriteria.length || 0} matched criteria from our scoring algorithm
              </CardDescription>
            </CardHeader>
          </Card>

          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Perfect Matches Found</h3>
                <p className="text-gray-600 mb-4">
                  Your criteria may be too restrictive. Try adjusting your requirements or budget.
                </p>
                <Button onClick={resetFinder}>
                  Start Over
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {recommendations.map((bender, index) => (
                <Card key={bender.id} className="relative">
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-600">
                      #{index + 1} Match - {bender.score} points
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <ProductCard product={bender} />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Why This Matches ({bender.matchedCriteria.length} criteria)</h4>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {bender.matchedCriteria.map((criteria, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {criteria}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {bender.reasons.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Key Advantages</h4>
                            <ul className="space-y-1">
                              {bender.reasons.map((reason, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start">
                                  <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="text-center">
                <Button onClick={resetFinder} variant="outline">
                  Try Different Criteria
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}