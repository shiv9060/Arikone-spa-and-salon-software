import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function DashboardPage({ 
  title, 
  children, 
  action, 
  backButton,
  href 
}: { 
  title: string, 
  children: ReactNode, 
  action?: ReactNode,
  backButton?: boolean,
  href?: string
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {backButton && href && (
            <Link href={href}>
              <Button variant="ghost" size="icon" type="button">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
