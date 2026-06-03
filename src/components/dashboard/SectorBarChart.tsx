import React from 'react';
import Chart from 'react-apexcharts';

interface SectorPerformanceData {
  entityName: string;
  averageScore: number;
}

interface SectorBarChartProps {
  data: SectorPerformanceData[];
}

export const SectorBarChart: React.FC<SectorBarChartProps> = ({ data }) => {
  const wrapAxisLabel = (label: string, maxLineLength = 16) => {
    const words = label.trim().split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;
      if (nextLine.length > maxLineLength && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = nextLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [label];
  };

  const categories = data.map((item) => wrapAxisLabel(item.entityName));
  const seriesData = data.map((item) => item.averageScore);

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
      fontFamily: 'inherit',
    },
    colors: ['#3b82f6'],
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '40%',
        distributed: false,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val + '%';
      },
      offsetY: -20,
      style: {
        fontSize: '11px',
        colors: ['#4a5568'],
      },
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories: categories.length > 0 ? categories : ['لا توجد قطاعات بعد'],
      position: 'bottom',
      labels: {
        rotate: 0,
        rotateAlways: false,
        trim: false,
        hideOverlappingLabels: false,
        maxHeight: 90,
        style: {
          fontSize: '11px',
          fontWeight: 500,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: true,
        formatter: function (val: number) {
          return val + '%';
        },
      },
      max: 100,
    },
    fill: {
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.85,
        opacityTo: 0.85,
        stops: [50, 0, 100],
      },
    },
    grid: {
      borderColor: '#edf2f7',
      strokeDashArray: 4,
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + '% امتثال';
        },
      },
    },
  };

  const chartSeries = [
    {
      name: 'متوسط درجات التفتيش المعتمدة',
      data: seriesData,
    },
  ];

  return (
    <div className="card" style={{ padding: '20px', height: '100%' }}>
      <h3 style={{ margin: '0 0 15px 0', color: 'var(--primary-color)', fontSize: '16px' }}>📊 مقارنة أداء القطاعات والمديريات الأمنية</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
        مقارنة متوسط نسب الامتثال والجاهزية عبر المديريات العامة الكبرى بالوزارة (مجمعة للمستوى الأول).
      </p>
      
      {data.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-light)' }}>
          لا توجد بيانات امتثال قطاعية متوفرة حالياً.
        </div>
      ) : (
        <div style={{ direction: 'ltr' }}>
          <Chart options={chartOptions} series={chartSeries} type="bar" height={330} />
        </div>
      )}
    </div>
  );
};
