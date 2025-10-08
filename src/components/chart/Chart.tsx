'use client'
import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as Plot from "@observablehq/plot";

// Tipos expandidos para diferentes tipos de dados de gráfico
interface BaseChartDataPoint {
  value: string | number;
  count: number;
  label?: string;
}

interface CorrelationDataPoint {
  x: string;
  y: string;
  value: number;
}

interface ScatterDataPoint {
  x: number;
  y: number;
  label?: string;
  group?: string;
}

interface BoxPlotDataPoint {
  category: string;
  value: number;
  q1?: number;
  q3?: number;
  median?: number;
  min?: number;
  max?: number;
  outliers?: number[];
  isOutlier?: boolean;
}

interface OutlierDataPoint {
  column: string;
  value: number;
  count: number;
  isOutlier?: boolean;
}

type ChartDataPoint = BaseChartDataPoint | CorrelationDataPoint | ScatterDataPoint | BoxPlotDataPoint | OutlierDataPoint;

// Tipos de gráfico expandidos
type ChartType = 
  | 'histogram' 
  | 'bar' 
  | 'line' 
  | 'scatter' 
  | 'correlation_heatmap' 
  | 'missing_values' 
  | 'outliers' 
  | 'distribution'
  | 'boxplot'
  | 'density'
  | 'violin';

interface ChartProps {
  data: ChartDataPoint[];
  chartType?: ChartType;
  width?: number;
  height?: number;
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export function Chart({ 
  data, 
  chartType = 'bar',
  width = 640, 
  height = 400, 
  title,
  xLabel = "Value",
  yLabel = "Count"
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Validação e tipagem dos dados baseada no tipo de gráfico
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Para tipos de gráfico básicos (bar, histogram, etc), esperamos BaseChartDataPoint
    if (['bar', 'histogram', 'missing_values', 'distribution', 'outliers', 'density'].includes(chartType)) {
      return data.filter((d): d is BaseChartDataPoint => 
        d && 
        typeof d === 'object' && 
        'value' in d &&
        'count' in d &&
        d.value !== undefined && d.value !== null &&
        d.count !== undefined && d.count !== null &&
        typeof d.count === 'number'
      );
    }
    
    // Para correlação, esperamos CorrelationDataPoint
    if (chartType === 'correlation_heatmap') {
      console.log('🔍 Processing correlation_heatmap data:', {
        originalDataLength: data.length,
        originalData: data.slice(0, 3),
        expectedFormat: 'CorrelationDataPoint with x, y, value properties'
      });
      
      const filtered = data.filter((d): d is CorrelationDataPoint => 
        d && 
        typeof d === 'object' && 
        'x' in d && 'y' in d && 'value' in d &&
        d.x !== undefined && d.y !== undefined && d.value !== undefined
      );
      
      console.log('🔍 Filtered correlation data:', {
        filteredLength: filtered.length,
        filteredData: filtered.slice(0, 3)
      });
      
      return filtered;
    }

    // Para scatter plots
    if (chartType === 'scatter') {
      console.log('🔍 Chart scatter data filtering:', {
        originalData: data.slice(0, 3),
        originalDataLength: data.length,
        dataStructure: data[0] ? Object.keys(data[0]) : 'no data'
      });
      
      const filtered = data.filter((d): d is ScatterDataPoint =>
        d &&
        typeof d === 'object' &&
        'x' in d && 'y' in d &&
        typeof d.x === 'number' && typeof d.y === 'number'
      );
      
      console.log('🔍 Chart scatter data filtered:', {
        filteredLength: filtered.length,
        filteredData: filtered.slice(0, 3)
      });
      
      return filtered;
    }

    // Para boxplots
    if (chartType === 'boxplot') {
      return data.filter((d): d is BoxPlotDataPoint =>
        d &&
        typeof d === 'object' &&
        'category' in d && 'value' in d &&
        d.category !== undefined && typeof d.value === 'number'
      );
    }
    
    return data;
  }, [data, chartType]);

  const createPlot = useCallback(() => {
    if (!processedData.length || !containerRef.current) {
      console.log('❌ Chart: No processed data or container', { 
        processedDataLength: processedData.length, 
        container: !!containerRef.current,
        chartType 
      });
      return null;
    }

    console.log('🎯 Chart: Creating plot', { 
      chartType,
      dataLength: processedData.length, 
      firstItem: processedData[0],
      title,
      plotAvailable: typeof Plot !== 'undefined'
    });

    // Verificar se Observable Plot está disponível
    if (typeof Plot === 'undefined') {
      console.error('❌ Observable Plot não está disponível');
      return null;
    }

    try {
      let plot;
      
      switch (chartType) {
        case 'histogram':
        case 'distribution': {
          const histData = processedData as BaseChartDataPoint[];
          console.log('📊 Creating histogram with data:', histData.slice(0, 3));
          
          plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 60,
            x: { label: xLabel },
            y: { label: yLabel },
            marks: [
              Plot.rectY(histData, {
                x: "value",
                y: "count",
                fill: "#3b82f6",
                fillOpacity: 0.7
              }),
              // Adicionar curva de densidade sobreposta
              Plot.lineY(histData, {
                x: "value",
                y: "count",
                stroke: "#ef4444",
                strokeWidth: 2,
                curve: "cardinal"
              }),
              Plot.ruleY([0])
            ]
          });
          break;
        }

        case 'bar': {
          const barData = processedData as BaseChartDataPoint[];
          console.log('📊 Creating bar chart with data:', barData.slice(0, 3));
          
          plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 60,
            x: { label: xLabel },
            y: { label: yLabel },
            marks: [
              Plot.barY(barData, {
                x: "value",
                y: "count",
                fill: "#3b82f6",
                tip: true // Tooltip interativo
              }),
              Plot.ruleY([0])
            ]
          });
          break;
        }

        case 'scatter': {
          const scatterData = processedData as ScatterDataPoint[];
          console.log('📊 Creating scatter plot with data:', scatterData.slice(0, 3));
          
          plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 60,
            x: { label: xLabel },
            y: { label: yLabel },
            color: { legend: true },
            marks: [
              Plot.dot(scatterData, {
                x: "x",
                y: "y",
                fill: "group",
                stroke: "white",
                strokeWidth: 1,
                r: 4,
                tip: true
              }),
              // Linha de tendência se houver dados suficientes
              ...(scatterData.length > 10 ? [
                Plot.linearRegressionY(scatterData, {
                  x: "x",
                  y: "y",
                  stroke: "#ef4444",
                  strokeWidth: 2,
                  strokeDasharray: "5,5"
                })
              ] : [])
            ]
          });
          break;
        }

        case 'correlation_heatmap': {
          const heatmapData = processedData as CorrelationDataPoint[];
          console.log('📊 Creating correlation heatmap with data:', {
            dataLength: heatmapData.length,
            firstThreeItems: heatmapData.slice(0, 3),
            allData: heatmapData
          });
          
          if (heatmapData.length === 0) {
            console.warn('⚠️ No correlation data available for heatmap');
            return null;
          }
          
          plot = Plot.plot({
            width,
            height,
            marginLeft: 100,
            marginBottom: 100,
            x: { label: "Variável 1" },
            y: { label: "Variável 2" },
            color: { 
              scheme: "RdBu", 
              reverse: true,
              legend: true,
              label: "Correlação"
            },
            marks: [
              Plot.cell(heatmapData, {
                x: "x",
                y: "y",
                fill: "value",
                tip: true
              }),
              Plot.text(heatmapData, {
                x: "x",
                y: "y",
                text: d => d.value?.toFixed(2) || '0.00',
                fill: d => Math.abs(d.value) > 0.5 ? "white" : "black",
                fontSize: 10
              })
            ]
          });
          break;
        }

        case 'boxplot': {
          const boxData = processedData as BoxPlotDataPoint[];
          console.log('📊 Creating box plot with data:', boxData.slice(0, 3));
          
          // Simplified box plot using individual data points
          plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 60,
            x: { label: xLabel },
            y: { label: yLabel },
            marks: [
              // Main data points
              Plot.dot(boxData.filter(d => !d.isOutlier), {
                x: "category",
                y: "value",
                fill: "#3b82f6",
                fillOpacity: 0.6,
                r: 2
              }),
              // Outliers highlighted
              Plot.dot(boxData.filter(d => d.isOutlier), {
                x: "category",
                y: "value",
                fill: "#ef4444",
                r: 4,
                stroke: "white",
                strokeWidth: 1,
                tip: true
              })
            ]
          });
          break;
        }

        case 'density': {
          const densityData = processedData as BaseChartDataPoint[];
          console.log('📊 Creating density plot with data:', densityData.slice(0, 3));
          
          plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 60,
            x: { label: xLabel },
            y: { label: "Densidade" },
            marks: [
              Plot.areaY(densityData, {
                x: "value",
                y: "count",
                fill: "#3b82f6",
                fillOpacity: 0.4,
                curve: "cardinal"
              }),
              Plot.lineY(densityData, {
                x: "value",
                y: "count",
                stroke: "#1e40af",
                strokeWidth: 2,
                curve: "cardinal"
              })
            ]
          });
          break;
        }

        case 'outliers': {
          const outlierData = processedData as OutlierDataPoint[];
          console.log('📊 Creating outlier plot with data:', outlierData.slice(0, 3));
          
          plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 60,
            x: { label: xLabel },
            y: { label: yLabel },
            color: { legend: true },
            marks: [
              Plot.dot(outlierData, {
                x: "value",
                y: "count",
                fill: (d: OutlierDataPoint) => d.isOutlier ? "#ef4444" : "#3b82f6",
                r: (d: OutlierDataPoint) => d.isOutlier ? 6 : 4,
                stroke: "white",
                strokeWidth: 1,
                tip: true
              })
            ]
          });
          break;
        }

        case 'line': {
          const lineData = processedData as BaseChartDataPoint[];
          console.log('📊 Creating line chart with data:', lineData.slice(0, 3));
          
          plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 60,
            x: { label: xLabel },
            y: { label: yLabel },
            marks: [
              Plot.lineY(lineData, {
                x: "value",
                y: "count",
                stroke: "#3b82f6",
                strokeWidth: 2,
                curve: "cardinal"
              }),
              Plot.dot(lineData, {
                x: "value",
                y: "count",
                fill: "#3b82f6",
                r: 3,
                tip: true
              }),
              Plot.ruleY([0])
            ]
          });
          break;
        }
          
        default: {
          // Fallback melhorado para barras
          const defaultData = processedData as BaseChartDataPoint[];
          console.log('📊 Creating default bar chart with data:', defaultData.slice(0, 3));
          
          plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 60,
            x: { label: xLabel },
            y: { label: yLabel },
            marks: [
              Plot.barY(defaultData, {
                x: "value",
                y: "count",
                fill: "#3b82f6",
                tip: true
              }),
              Plot.ruleY([0])
            ]
          });
          break;
        }
      }
      
      console.log('✅ Chart: Plot created successfully');
      return plot;
      
    } catch (error) {
      console.error('❌ Erro ao criar gráfico Observable Plot:', error);
      return null;
    }
  }, [processedData, chartType, width, height, xLabel, yLabel, title]);

  const renderChart = useCallback(() => {
    if (!containerRef.current) {
      console.log('❌ Chart: No container ref available');
      return;
    }
    
    // Limpar container
    containerRef.current.innerHTML = '';
    console.log('🧹 Chart: Container cleared');
    
    const plot = createPlot();
    
    if (plot) {
      console.log('✅ Chart: Observable Plot created, appending to container');
      containerRef.current.appendChild(plot);
      console.log('📊 Chart: Plot successfully appended to DOM');
      
      return () => {
        console.log('🧹 Chart: Cleaning up plot');
        if (plot.parentNode) {
          plot.remove();
        }
      };
    } else {
      // Fallback melhorado com CSS
      console.log('⚠️ Chart: Using enhanced CSS fallback');
      const fallbackData = processedData as BaseChartDataPoint[];
      
      if (fallbackData.length === 0) {
        containerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full">
            <div class="text-center p-8">
              <div class="text-gray-400 mb-2 text-2xl">📊</div>
              <p class="text-gray-500">Nenhum dado válido para renderizar</p>
              <p class="text-xs text-gray-400 mt-1">Tipo: ${chartType}</p>
            </div>
          </div>
        `;
        return;
      }

      const maxCount = Math.max(...fallbackData.map(d => d.count));
      
      // Fallback específico por tipo de gráfico
      if (chartType === 'scatter') {
        const scatterData = processedData as ScatterDataPoint[];
        containerRef.current.innerHTML = `
          <div class="h-full flex flex-col p-4">
            <div class="text-center mb-4">
              <h4 class="font-medium text-gray-700">${title || 'Scatter Plot'}</h4>
              <p class="text-xs text-gray-500">Visualização simplificada (${scatterData.length} pontos)</p>
            </div>
            <div class="flex-1 relative bg-gray-50 rounded border">
              ${scatterData.slice(0, 20).map((d) => `
                <div 
                  class="absolute w-2 h-2 bg-blue-500 rounded-full"
                  style="left: ${((d.x || 0) % 100)}%; top: ${((d.y || 0) % 100)}%;"
                  title="${d.label || 'Ponto'}: (${d.x}, ${d.y})"
                ></div>
              `).join('')}
            </div>
            <div class="text-center text-xs text-gray-500 mt-2">
              ${xLabel} vs ${yLabel}
            </div>
          </div>
        `;
      } else if (chartType === 'correlation_heatmap') {
        const heatmapData = processedData as CorrelationDataPoint[];
        containerRef.current.innerHTML = `
          <div class="h-full flex flex-col p-4">
            <div class="text-center mb-4">
              <h4 class="font-medium text-gray-700">${title || 'Mapa de Correlação'}</h4>
            </div>
            <div class="flex-1 space-y-1">
              ${heatmapData.slice(0, 10).map(d => `
                <div class="flex items-center justify-between p-2 rounded text-sm">
                  <span class="text-gray-700 truncate flex-1">${d.x} × ${d.y}</span>
                  <div class="flex items-center space-x-2">
                    <div 
                      class="w-16 h-4 rounded"
                      style="background-color: ${d.value > 0 ? '#ef4444' : '#3b82f6'}; opacity: ${Math.abs(d.value)}"
                    ></div>
                    <span class="font-mono text-xs w-12 text-right">${d.value.toFixed(2)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        // Fallback padrão melhorado para gráficos de barras
        containerRef.current.innerHTML = `
          <div class="h-full flex flex-col p-4">
            <div class="text-center mb-4">
              <h4 class="font-medium text-gray-700">${title || 'Gráfico'}</h4>
              <p class="text-xs text-gray-500">Tipo: ${chartType} • ${fallbackData.length} pontos</p>
            </div>
            <div class="flex-1 flex items-end space-x-1">
              ${fallbackData.slice(0, 15).map((d) => `
                <div class="flex-1 flex flex-col items-center group">
                  <div 
                    class="bg-blue-500 w-full rounded-t transition-all duration-300 hover:bg-blue-600 group-hover:scale-105"
                    style="height: ${Math.max(4, (d.count / maxCount) * 200)}px;"
                    title="${d.value}: ${d.count}"
                  ></div>
                  <div class="text-xs text-gray-600 mt-1 truncate w-full text-center transform group-hover:scale-110 transition-transform">
                    ${String(d.value).length > 6 ? String(d.value).substring(0, 6) + '...' : d.value}
                  </div>
                  <div class="text-xs text-gray-400 font-mono">${d.count}</div>
                </div>
              `).join('')}
            </div>
            ${fallbackData.length > 15 ? `
              <div class="text-center text-xs text-gray-400 mt-2">
                ... e mais ${fallbackData.length - 15} pontos
              </div>
            ` : ''}
            <div class="text-center text-xs text-gray-500 mt-2 border-t pt-2">
              ${xLabel} × ${yLabel}
            </div>
          </div>
        `;
      }
      console.log('✅ Chart: Enhanced CSS fallback rendered successfully');
    }
  }, [createPlot, processedData, title, chartType, xLabel, yLabel]);
  
  useEffect(() => {
    const cleanup = renderChart();
    return cleanup;
  }, [renderChart]);
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg w-full h-96">
        <div className="text-center">
          <div className="text-gray-400 mb-2 text-2xl">📊</div>
          <p className="text-gray-500">Nenhum dado disponível para exibir</p>
          <p className="text-xs text-gray-400 mt-1">Tipo: {chartType}</p>
        </div>
      </div>
    );
  }

  // Debug: log dos dados recebidos
  console.log('🎯 Chart component received data:', { 
    dataLength: data.length, 
    chartType, 
    processedLength: processedData.length,
    firstItem: data[0],
    title,
    xLabel,
    yLabel
  });
  
  // Log adicional para debugging
  if (processedData.length > 0) {
    console.log('✅ Chart data sample:', processedData.slice(0, 3));
    console.log('📐 Chart dimensions:', { width, height });
  }
  
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      
      {/* Informações de debug melhoradas */}
      <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded">
        📊 Tipo: <span className="font-medium">{chartType}</span> | 
        Dados: <span className="font-medium">{processedData.length}</span> pontos | 
        Observable Plot: <span className="font-medium">{typeof Plot !== 'undefined' ? 'Disponível' : 'Indisponível'}</span>
        {processedData.length > 0 && (
          <>
            <br />
            <span className="text-gray-400">Primeiro item: {JSON.stringify(processedData[0])}</span>
          </>
        )}
      </div>
      
      <div 
        ref={containerRef} 
        className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm w-full h-96"
      />
    </div>
  );
}