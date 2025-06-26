import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
interface ModernActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  gradient?: string;
  count?: number;
}
export const ModernActionCard: React.FC<ModernActionCardProps> = ({
  title,
  description,
  icon: Icon,
  link,
  gradient = 'from-blue-500 to-purple-600',
  count
}) => {
  return (
    <Link to={link}>
      <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 shadow-lg overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
        <CardContent className="p-6 relative z-10">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          {count !== undefined && (
            <div className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-xs font-medium">
              {count} items
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
