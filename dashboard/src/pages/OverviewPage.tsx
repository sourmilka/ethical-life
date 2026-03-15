import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api } from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SERVER_URL = API_URL.replace(/\/api\/?$/, '');

import { PageHeader, StatusBadge } from '@/components/ui';
import {
  ClipboardList,
  Bell,
  ShoppingBag,
  PenLine,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SubmissionPreview {
  id: string;
  status: string;
  createdAt: string;
  formDefinition: { name: string } | null;
  data: { fieldKey: string; value: string | null }[];
}

interface StatsData {
  totalSubmissions: number;
  newToday: number;
  totalProducts: number;
  totalBlogPosts: number;
  recentSubmissions: SubmissionPreview[];
}

const statusVariant = (s: string) => {
  switch (s) {
    case 'new': return 'info' as const;
    case 'reviewed': return 'warning' as const;
    case 'completed': return 'success' as const;
    default: return 'default' as const;
  }
};

export function OverviewPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api<{ data: StatsData }>('/submissions/stats').then((r) => r.data),
  });

  const cards = [
    { label: 'Total Submissions', value: stats?.totalSubmissions ?? 0, icon: ClipboardList },
    { label: 'New Today', value: stats?.newToday ?? 0, icon: Bell },
    { label: 'Products', value: stats?.totalProducts ?? 0, icon: ShoppingBag },
    { label: 'Blog Posts', value: stats?.totalBlogPosts ?? 0, icon: PenLine },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your site at a glance." />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{c.label}</p>
              <c.icon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {isLoading ? '\u2014' : c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => window.open(SERVER_URL || '/', '_blank')}
          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4" /> View Live Site
        </button>
        <button
          onClick={() => navigate('/dashboard/content/products')}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
        <button
          onClick={() => navigate('/dashboard/content/blog')}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Write Blog Post
        </button>
        <button
          onClick={() => navigate('/dashboard/forms/submissions')}
          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ClipboardList className="h-4 w-4" /> View Submissions
        </button>
      </div>

      {/* Recent submissions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Submissions</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          </div>
        ) : !stats?.recentSubmissions.length ? (
          <p className="text-sm text-gray-500">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Form</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {stats.recentSubmissions.map((s) => {
                  const nameField = s.data.find(
                    (d) => d.fieldKey === 'name' || d.fieldKey === 'fullName' || d.fieldKey === 'firstName',
                  );
                  return (
                    <tr
                      key={s.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/dashboard/forms/submissions/${s.id}`)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {nameField?.value || 'Unknown'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {s.formDefinition?.name || '\u2014'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge label={s.status} variant={statusVariant(s.status)} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
