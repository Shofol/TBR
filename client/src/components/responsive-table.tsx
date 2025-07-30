import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trophy, Medal, ExternalLink } from "lucide-react";
import { useDeviceDetection } from "@/hooks/use-device-detection";
import { calculateTubeBenderScore } from "@/lib/scoring-algorithm";
import ScoringBreakdown from "./scoring-breakdown";
import PriceBreakdown from "./price-breakdown";
import { TubeBender } from "@shared/schema";
import { Link } from "wouter";

interface ResponsiveTableProps {
  products: TubeBender[];
}

// Original comparison table color system (reverted as requested)
const getScoreColor = (score: number): string => {
  if (score >= 85) return "text-green-500";
  if (score >= 75) return "text-blue-500"; 
  if (score >= 65) return "text-yellow-500";
  return "text-red-500";
};

export default function ResponsiveTable({ products }: ResponsiveTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<TubeBender | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const deviceInfo = useDeviceDetection();

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-accent" />;
      case 1:
      case 2:
        return <Medal className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const handlePriceClick = (product: TubeBender) => {
    setSelectedProduct(product);
    setShowBreakdown(true);
  };

  const toggleCardExpansion = (productId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedCards(newExpanded);
  };

  // Mobile/Tablet Card Layout
  if (deviceInfo.isMobile || deviceInfo.isTablet) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Tube Bender Comparison</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Products ranked by comprehensive scoring algorithm • Highest rated first
          </p>
        </div>
        
        {products.map((product, index) => {
          const score = calculateTubeBenderScore(product);
          const isExpanded = expandedCards.has(product.id);
          
          return (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(index)}
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.model}</p>
                    </div>
                  </div>
                  
                  {/* Score Circle */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                        <circle 
                          cx="24" 
                          cy="24" 
                          r="20" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          fill="transparent" 
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle 
                          cx="24" 
                          cy="24" 
                          r="20" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          fill="transparent" 
                          strokeDasharray={`${Math.round(score.totalScore) * 1.26} 126`}
                          className={getScoreColor(Math.round(score.totalScore))}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xs font-bold">{Math.round(score.totalScore)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Essential Info Always Visible */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Price:</span>
                    <button
                      onClick={() => handlePriceClick(product)}
                      className="block text-primary hover:underline"
                    >
                      {product.componentPricing && product.priceMin && product.priceMax
                        ? `$${Number(product.priceMin).toLocaleString()} - $${Number(product.priceMax).toLocaleString()}`
                        : product.priceRange
                      }
                    </button>
                  </div>
                  <div>
                    <span className="font-medium">Max Capacity:</span>
                    <span className="block">{product.maxCapacity}</span>
                  </div>
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="grid grid-cols-1 gap-3 text-sm pt-3 border-t">
                    <div><span className="font-medium">Wall Thickness:</span> {product.wallThicknessCapacity}</div>
                    <div><span className="font-medium">Bend Angle:</span> {product.bendAngle}°</div>
                    <div><span className="font-medium">Materials:</span> {product.materials?.join(', ')}</div>
                    <div><span className="font-medium">Made in:</span> {product.countryOfOrigin}</div>
                    <div><span className="font-medium">Mandrel:</span> {product.mandrelBender || 'Not Available'}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCardExpansion(product.id)}
                    className="w-full"
                  >
                    {isExpanded ? (
                      <>Hide Details <ChevronUp className="ml-2 h-4 w-4" /></>
                    ) : (
                      <>Show Details <ChevronDown className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                  
                  <Link href={`/product/${product.id}`}>
                    <Button size="sm" className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Full Review
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Modals */}
        {showBreakdown && selectedProduct && (
          <PriceBreakdown 
            product={selectedProduct} 
            isOpen={showBreakdown}
            onClose={() => setShowBreakdown(false)} 
          />
        )}
      </div>
    );
  }

  // Desktop Table Layout
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Tube Bender Comparison
        </CardTitle>
        <p className="text-sm text-center text-muted-foreground mt-2">
          Products ranked by comprehensive scoring algorithm • Highest rated first
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                <TableHead className="text-white font-semibold min-w-[200px]">Model</TableHead>
                <TableHead className="text-white font-semibold text-center">
                  <div>Rating</div>
                  <button 
                    onClick={() => window.open('/scoring-methodology', '_blank')}
                    className="text-xs text-blue-200 hover:text-blue-100 underline mt-1"
                    type="button"
                  >
                    scoring details
                  </button>
                </TableHead>
                <TableHead className="text-white font-semibold text-center">
                  <div>Price (complete setup)</div>
                  <div className="text-xs text-blue-200 mt-1">Click for breakdown</div>
                </TableHead>
                <TableHead className="text-white font-semibold text-center">Max Capacity</TableHead>
                <TableHead className="text-white font-semibold text-center">Wall Thickness</TableHead>
                <TableHead className="text-white font-semibold text-center">Bend Angle</TableHead>
                <TableHead className="text-white font-semibold text-center">Power Type</TableHead>
                <TableHead className="text-white font-semibold text-center">Made in</TableHead>
                <TableHead className="text-white font-semibold text-center">Mandrel</TableHead>
                <TableHead className="text-white font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={product.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(index)}
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          #{index + 1}
                        </Badge>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{product.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{product.model}</div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-16 h-16 mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                          <circle 
                            cx="32" 
                            cy="32" 
                            r="28" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            fill="transparent" 
                            className="text-gray-200 dark:text-gray-700"
                          />
                          <circle 
                            cx="32" 
                            cy="32" 
                            r="28" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            fill="transparent" 
                            strokeDasharray={`${Math.round(calculateTubeBenderScore(product).totalScore) * 1.76} 176`}
                            className={getScoreColor(Math.round(calculateTubeBenderScore(product).totalScore))}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {Math.round(calculateTubeBenderScore(product).totalScore)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">/100</div>
                          </div>
                        </div>
                      </div>
                      <Link href={`/product/${product.id}`}>
                        <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary hover:underline cursor-pointer transition-colors">
                          Click for breakdown
                        </button>
                      </Link>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <button
                      onClick={() => handlePriceClick(product)}
                      className="font-semibold cursor-pointer hover:underline transition-colors text-gray-900 dark:text-gray-100 hover:text-primary"
                    >
                      {product.componentPricing && product.priceMin && product.priceMax
                        ? `$${Number(product.priceMin).toLocaleString()} - $${Number(product.priceMax).toLocaleString()}`
                        : product.priceRange
                      }
                    </button>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click for breakdown</div>
                  </TableCell>
                  
                  <TableCell className="text-center font-medium">{product.maxCapacity}</TableCell>
                  <TableCell className="text-center">{product.wallThicknessCapacity}</TableCell>
                  <TableCell className="text-center">{product.bendAngle}°</TableCell>
                  <TableCell className="text-center">{product.powerType}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.countryOfOrigin === "USA" ? "default" : "secondary"}>
                      {product.countryOfOrigin}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.mandrelBender === "Available" ? "default" : "secondary"}>
                      {product.mandrelBender || 'Not Available'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/product/${product.id}`}>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Review
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Modals */}
      {showBreakdown && selectedProduct && (
        <PriceBreakdown 
          product={selectedProduct} 
          isOpen={showBreakdown}
          onClose={() => setShowBreakdown(false)} 
        />
      )}
    </Card>
  );
}