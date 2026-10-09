import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import prisma from "@/lib/db/prisma";
import { DEFAULT_TEMPLATES } from "@/lib/whatsapp/templates";
import { WhatsAppMessageType } from "@prisma/client";

export const metadata = {
  title: "WhatsApp Templates | Arikone",
};

export default async function WhatsAppTemplatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.role, "WHATSAPP_VIEW")) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p>You do not have permission to view WhatsApp templates.</p>
      </div>
    );
  }

  const customTemplates = await prisma.messageTemplate.findMany({
    where: { tenantId: session.tenantId },
  });

  const types = Object.keys(DEFAULT_TEMPLATES) as WhatsAppMessageType[];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Message Templates</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {types.map((type) => {
          const custom = customTemplates.find((t) => t.type === type);
          const isCustom = !!custom;
          const content = custom ? custom.content : DEFAULT_TEMPLATES[type];

          return (
            <div key={type} className="bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col">
              <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">{type.replace(/_/g, " ")}</h3>
                {isCustom ? (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full font-medium">Custom</span>
                ) : (
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">Default</span>
                )}
              </div>
              <div className="p-4 flex-1">
                <div className="bg-green-50 text-green-900 p-4 rounded-lg whitespace-pre-wrap font-sans text-sm border border-green-100 h-full relative">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500 opacity-50"></div>
                  </div>
                  {content}
                </div>
              </div>
              {hasPermission(session.role, "WHATSAPP_SETTINGS") && (
                <div className="px-4 py-3 bg-gray-50 border-t mt-auto">
                  <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800" disabled>
                    Edit Template (Coming Soon)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
