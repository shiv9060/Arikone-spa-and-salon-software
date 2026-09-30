"use client";

import { useState } from "react";
import { updateWhatsAppSettings } from "../actions";

export function WhatsAppSettingsForm({ initialData, offers = [] }: { initialData: any, offers?: any[] }) {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, type } = target;
    const value = type === 'checkbox' ? target.checked : target.value;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await updateWhatsAppSettings(formData);
      setMessage("Settings saved successfully.");
    } catch (err: any) {
      setMessage(err.message || "Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      
      {message && (
        <div className={`p-3 rounded-md text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <div className="flex items-center justify-between p-4 border rounded-md">
        <div>
          <h3 className="font-medium">Enable WhatsApp Integration</h3>
          <p className="text-sm text-gray-500">Master switch to enable or disable all WhatsApp features.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" name="enabled" checked={formData.enabled} onChange={handleChange} className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {formData.enabled && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h3 className="font-medium">Appointment Confirmations</h3>
              <p className="text-sm text-gray-500">Send an automated message when an appointment is confirmed.</p>
            </div>
            <input type="checkbox" name="appointmentConfirmationEnabled" checked={formData.appointmentConfirmationEnabled} onChange={handleChange} className="h-5 w-5 text-indigo-600 rounded border-gray-300" />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h3 className="font-medium">Appointment Reminders</h3>
              <p className="text-sm text-gray-500">Send an automated reminder 24 hours before an appointment.</p>
            </div>
            <input type="checkbox" name="appointmentRemindersEnabled" checked={formData.appointmentRemindersEnabled} onChange={handleChange} className="h-5 w-5 text-indigo-600 rounded border-gray-300" />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h3 className="font-medium">Cancellation Messages</h3>
              <p className="text-sm text-gray-500">Send a message when an appointment is cancelled.</p>
            </div>
            <input type="checkbox" name="cancellationMessagesEnabled" checked={formData.cancellationMessagesEnabled} onChange={handleChange} className="h-5 w-5 text-indigo-600 rounded border-gray-300" />
          </div>

          <div className="border rounded-md">
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-medium">Birthday Campaigns</h3>
                <p className="text-sm text-gray-500">Automatically send birthday greetings to customers.</p>
              </div>
              <input type="checkbox" name="birthdayMessagesEnabled" checked={formData.birthdayMessagesEnabled} onChange={handleChange} className="h-5 w-5 text-indigo-600 rounded border-gray-300" />
            </div>
            
            {formData.birthdayMessagesEnabled && (
              <div className="p-4 border-t bg-gray-50 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attach Birthday Offer (Optional)</label>
                  <select 
                    name="birthdayOfferId" 
                    value={formData.birthdayOfferId || ""} 
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white"
                  >
                    <option value="">-- No Offer --</option>
                    {offers.map(offer => (
                      <option key={offer.id} value={offer.id}>{offer.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Select an active offer to include a coupon code in the birthday message.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
