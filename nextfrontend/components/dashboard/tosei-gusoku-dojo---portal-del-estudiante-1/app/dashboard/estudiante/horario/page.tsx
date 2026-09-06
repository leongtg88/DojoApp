'use client';

import React, { useState } from 'react';
import { mockSchedules } from '@/data/mock-data';
import { WeeklyScheduleSection } from '@/components/dashboard/WeeklyScheduleSection';

export default function MiHorarioPage() {
  const [schedules] = useState(mockSchedules);

  return (
    <div className="flex flex-col w-full gap-4 sm:gap-5 max-w-4xl mx-auto">
      <WeeklyScheduleSection schedules={schedules} />
    </div>
  );
}
