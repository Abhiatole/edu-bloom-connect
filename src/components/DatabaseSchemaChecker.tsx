import React, { useState, useEffect } from 'react';
import { checkRequiredTables } from '@/utils/database-utils';
import MissingTablesAlert from '@/components/MissingTablesAlert';
interface DatabaseSchemaCheckerProps {
  requiredTables: string[];
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}
/**
 * Component that checks if required database tables exist before rendering children
 * Shows a missing tables alert if any required tables are missing
 */
const DatabaseSchemaChecker: React.FC<DatabaseSchemaCheckerProps> = ({
  requiredTables,
  children,
  loadingComponent = (
    <div className="flex justify-center items-center min-h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
}) => {
  const [missingTables, setMissingTables] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const checkSchema = async () => {
      try {
        const { missingTables: missing } = await checkRequiredTables(requiredTables);
        setMissingTables(missing);
      } catch (error) {
        // Assume all tables might be missing in case of error
        setMissingTables(requiredTables);
      } finally {
        setChecking(false);
      }
    };
    checkSchema();
  }, [requiredTables]);
  if (checking) {
    return <>{loadingComponent}</>;
  }
  return (
    <>
      {missingTables.length > 0 && <MissingTablesAlert missingTables={missingTables} />}
      {children}
    </>
  );
};
export default DatabaseSchemaChecker;
