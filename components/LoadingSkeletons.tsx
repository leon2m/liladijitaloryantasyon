import React from 'react';

export const OrientationCardSkeleton: React.FC = () => (
    <div className="glass-card p-8 flex flex-col md:flex-row items-center gap-8 bg-gray-50/50">
        <div className="h-24 w-24 rounded-full skeleton flex-shrink-0"></div>
        <div className="flex-grow w-full">
            <div className="h-7 w-3/4 skeleton mb-3"></div>
            <div className="h-4 w-full skeleton mb-4"></div>
            <div className="h-4 w-1/2 skeleton mb-4"></div>
            <div className="h-2.5 w-full skeleton rounded-full"></div>
        </div>
        <div className="h-12 w-full md:w-48 skeleton rounded-xl mt-4 md:mt-0 flex-shrink-0"></div>
    </div>
);

export const TestCardSkeleton: React.FC = () => (
    <div className="glass-card p-0 flex flex-col items-start overflow-hidden bg-gray-50/50">
      <div className="w-full h-28 flex items-center justify-center bg-gray-200/50 relative">
          <div className="h-20 w-20 rounded-full skeleton"></div>
      </div>
      <div className="p-6 w-full">
         <div className="h-6 w-3/4 skeleton mb-3"></div>
         <div className="h-4 w-full skeleton mb-2"></div>
         <div className="h-4 w-full skeleton mb-2"></div>
         <div className="h-4 w-2/3 skeleton mb-6"></div>
         <div className="h-12 w-full skeleton rounded-xl mt-auto"></div>
      </div>
    </div>
);