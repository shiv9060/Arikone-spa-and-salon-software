#!/bin/bash
MODULES=("customers" "appointments" "services" "staff" "billing" "payments" "reports" "offers" "whatsapp" "settings")

for MODULE in "${MODULES[@]}"; do
  mkdir -p "src/app/dashboard/$MODULE"
  TITLE=$(echo "$MODULE" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
  
  cat << INNER_EOF > "src/app/dashboard/$MODULE/page.tsx"
import { Construction } from 'lucide-react';

export default function ${TITLE}Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-indigo-50 p-6 mb-6">
        <Construction className="h-12 w-12 text-indigo-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">${TITLE} Module</h1>
      <p className="text-gray-500 max-w-md">
        This module is scheduled for development in the upcoming phase. The backend architecture and database schema are already prepared.
      </p>
    </div>
  );
}
INNER_EOF

done
