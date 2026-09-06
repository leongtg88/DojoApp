'use client';

import React from 'react';
import { DojoProvider, useDojo } from '@/context/DojoContext';
import { AppShell } from '@/components/dojo/AppShell';
import { StudentDashboardView } from '@/components/views/StudentDashboardView';
import { StudentKatasView } from '@/components/views/StudentKatasView';
import { StudentScheduleView } from '@/components/views/StudentScheduleView';
import { StudentProfileView } from '@/components/views/StudentProfileView';
import { InstructorEvalView } from '@/components/views/InstructorEvalView';
import { InstructorStudentsView } from '@/components/views/InstructorStudentsView';
import { AdminCurriculumView } from '@/components/views/AdminCurriculumView';
import { AdminStudentsView } from '@/components/views/AdminStudentsView';
import { AdminStudentDetailView } from '@/components/views/AdminStudentDetailView';
import { DeliverableDocumentationView } from '@/components/views/DeliverableDocumentationView';

function DojoAppRouter() {
  const { currentRoute } = useDojo();

  const renderActiveView = () => {
    switch (currentRoute) {
      case 'student-dashboard':
        return <StudentDashboardView />;
      case 'student-katas':
        return <StudentKatasView />;
      case 'student-schedule':
      case 'instructor-schedule':
        return <StudentScheduleView />;
      case 'student-profile':
        return <StudentProfileView />;
      case 'instructor-eval':
        return <InstructorEvalView />;
      case 'instructor-students':
        return <InstructorStudentsView />;
      case 'admin-curriculum':
        return <AdminCurriculumView />;
      case 'admin-students':
        return <AdminStudentsView />;
      case 'admin-student-detail':
        return <AdminStudentDetailView />;
      case 'deliverable-docs':
        return <DeliverableDocumentationView />;
      default:
        return <StudentDashboardView />;
    }
  };

  return <AppShell>{renderActiveView()}</AppShell>;
}

export default function DojoApp() {
  return (
    <DojoProvider>
      <DojoAppRouter />
    </DojoProvider>
  );
}
