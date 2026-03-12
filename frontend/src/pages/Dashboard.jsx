import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { dashboardAPI } from '../services/api';
import { toast } from 'sonner';
import {
  Users,
  Home,
  FileText,
  Bell,
  CreditCard,
  Receipt,
  ArrowRight,
  TrendingUp,
  PiggyBank,
} from 'lucide-react';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color, link }) => (
  <Link to={link}>
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-slate-500 group-hover:text-sky-600 transition-colors">
          <span>View details</span>
          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

const RecentTable = ({ title, items, columns, link, emptyMessage }) => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
        <Link to={link} className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </CardHeader>
    <CardContent>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {columns.map((col, colIndex) => (
                <div key={colIndex} className={col.className}>
                  {col.render ? col.render(item) : item[col.key]}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      </Layout>
    );
  }

  const currentMonth = format(new Date(), 'MMMM yyyy');
  const totalIncome = stats?.monthly_payments || 0;
  const totalExpenses = stats?.monthly_expenses || 0;
  const totalInvested = stats?.monthly_invested || 0;
  const netProfit = totalIncome + totalInvested - totalExpenses;

  return (
    <Layout>
      <div className="space-y-8" data-testid="dashboard-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your property management system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Tenants"
            value={stats?.total_tenants || 0}
            icon={Users}
            color="bg-sky-500"
            link="/tenants"
          />
          <StatCard
            title="Total Owners"
            value={stats?.total_owners || 0}
            icon={Home}
            color="bg-emerald-500"
            link="/owners"
          />
          <StatCard
            title="Active Agreements"
            value={stats?.active_agreements || 0}
            icon={FileText}
            color="bg-violet-500"
            link="/agreements"
          />
          <StatCard
            title="Pending Notices"
            value={stats?.pending_notices || 0}
            icon={Bell}
            color="bg-amber-500"
            link="/notices"
          />
          <StatCard
            title={`Invested (${currentMonth})`}
            value={formatCurrency(totalInvested)}
            icon={PiggyBank}
            color="bg-emerald-600"
            link="/profile/bank-investments"
          />
          <StatCard
            title={`Payments (${currentMonth})`}
            value={formatCurrency(totalIncome)}
            icon={CreditCard}
            color="bg-blue-500"
            link="/payments"
          />
          <StatCard
            title={`Expenses (${currentMonth})`}
            value={formatCurrency(totalExpenses)}
            icon={Receipt}
            color="bg-red-500"
            link="/expenses"
          />
          <StatCard
            title={`Net Profit / Loss (${currentMonth})`}
            value={formatCurrency(netProfit)}
            icon={TrendingUp}
            color={netProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"}
            link="/dashboard"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tenants */}
          <RecentTable
            title="Recent Tenants"
            items={stats?.recent_tenants || []}
            link="/tenants"
            emptyMessage="No tenants yet"
            columns={[
              {
                key: 'tenant_name',
                className: 'flex-1',
                render: (item) => (
                  <div>
                    <p className="font-medium text-slate-900">{item.tenant_name}</p>
                    <p className="text-xs text-slate-500">Room {item.room_number}</p>
                  </div>
                )
              },
              {
                key: 'joining_date',
                className: 'text-right',
                render: (item) => (
                  <Badge variant="outline" className="text-xs">
                    {item.joining_date ? format(new Date(item.joining_date), 'dd MMM') : '-'}
                  </Badge>
                )
              }
            ]}
          />

          {/* Recent Notices */}
          <RecentTable
            title="Recent Notices"
            items={stats?.recent_notices || []}
            link="/notices"
            emptyMessage="No notices yet"
            columns={[
              {
                key: 'tenant_name',
                className: 'flex-1',
                render: (item) => (
                  <div>
                    <p className="font-medium text-slate-900">{item.tenant_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">Leaving: {item.leaving_date ? format(new Date(item.leaving_date), 'dd MMM') : '-'}</p>
                  </div>
                )
              },
              {
                key: 'notice_date',
                className: 'text-right',
                render: (item) => (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                    Notice
                  </Badge>
                )
              }
            ]}
          />

          {/* Recent Expenses */}
          <RecentTable
            title="Recent Expenses"
            items={stats?.recent_expenses || []}
            link="/expenses"
            emptyMessage="No expenses yet"
            columns={[
              {
                key: 'expense_type',
                className: 'flex-1',
                render: (item) => (
                  <div>
                    <p className="font-medium text-slate-900">{item.expense_type}</p>
                    <p className="text-xs text-slate-500">{item.date ? format(new Date(item.date), 'dd MMM') : '-'}</p>
                  </div>
                )
              },
              {
                key: 'amount',
                className: 'text-right',
                render: (item) => (
                  <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                )
              }
            ]}
          />
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Monthly Summary - {currentMonth}</h3>
                <p className="text-slate-300 mt-1">
                  Invested: {formatCurrency(totalInvested)} | Total Income: {formatCurrency(totalIncome)} | Total Expenses: {formatCurrency(totalExpenses)} | Net: {formatCurrency(netProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
