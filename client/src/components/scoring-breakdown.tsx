import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { calculateTubeBenderScore, type ScoredTubeBender } from "@/lib/scoring-algorithm";
import type { TubeBender } from "@shared/schema";

// Helper function for badge colors with custom styling to fix color display
const getScoreVariant = (points: number, maxPoints: number) => {
  const percentage = (points / maxPoints) * 100;
  
  if (percentage === 100) {
    return { variant: "default" as const, className: "bg-green-500 text-white border-green-500" };    // Green
  }
  if (percentage >= 75) {
    return { variant: "secondary" as const, className: "bg-yellow-500 text-white border-yellow-500" }; // Yellow  
  }
  if (percentage >= 50) {
    return { variant: "secondary" as const, className: "bg-orange-500 text-white border-orange-500" }; // Orange
  }
  if (percentage >= 25) {
    return { variant: "secondary" as const, className: "bg-red-500 text-white border-red-500" };       // Red
  }
  return { variant: "secondary" as const, className: "bg-gray-500 text-white border-gray-500" };       // Gray
};

// Helper function for TOTAL SCORE badge to match comparison table circles
const getTotalScoreColor = (score: number) => {
  if (score >= 85) {
    return { variant: "default" as const, className: "bg-green-500 text-white border-green-500" };     // Green
  }
  if (score >= 75) {
    return { variant: "secondary" as const, className: "bg-blue-500 text-white border-blue-500" };     // Blue  
  }
  if (score >= 65) {
    return { variant: "secondary" as const, className: "bg-yellow-500 text-white border-yellow-500" }; // Yellow
  }
  return { variant: "secondary" as const, className: "bg-red-500 text-white border-red-500" };         // Red
};

interface ScoringBreakdownProps {
  product: TubeBender;
  className?: string;
}

export default function ScoringBreakdown({ product, className = "" }: ScoringBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Simple fallback scoring for products without new fields
  let scoredProduct;
  try {
    scoredProduct = calculateTubeBenderScore(product);
  } catch (error) {
    // Fallback simple scoring based on existing fields
    const baseScore = Math.round(parseFloat(product.rating) * 10);
    scoredProduct = {
      ...product,
      totalScore: baseScore,
      scoreBreakdown: [
        {
          criteria: "Overall Rating",
          points: baseScore,
          maxPoints: 100,
          reasoning: `Based on ${product.rating}/10 rating`
        }
      ]
    };
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Objective Score</CardTitle>
            <CardDescription>Algorithm-based evaluation</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {scoredProduct.totalScore}/100
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {isExpanded ? (
                <>
                  Hide Breakdown <ChevronUp className="ml-1 h-3 w-3" />
                </>
              ) : (
                <>
                  Show Breakdown <ChevronDown className="ml-1 h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {scoredProduct.scoreBreakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.criteria}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.reasoning}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <Badge 
                    variant={getScoreVariant(item.points, item.maxPoints).variant}
                    className={getScoreVariant(item.points, item.maxPoints).className}
                  >
                    {item.points}/{item.maxPoints}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total Score:</span>
              <Badge 
                variant={getTotalScoreColor(scoredProduct.totalScore).variant}
                className={`text-sm px-3 py-1 ${getTotalScoreColor(scoredProduct.totalScore).className}`}
              >
                {scoredProduct.totalScore}/100
              </Badge>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/scoring-methodology">
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="mr-2 h-3 w-3" />
                How scores are calculated
              </Button>
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  );
}