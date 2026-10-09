'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { estimateAudienceSize, createCampaign, AudienceFilter } from '@/app/dashboard/whatsapp/campaigns/new/actions';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Check, Users, MessageSquare, Megaphone, Send } from 'lucide-react';

const CAMPAIGN_TYPES = [
  { value: 'PROMOTIONAL', label: 'Promotional' },
  { value: 'REENGAGEMENT', label: 'Re-engagement' },
  { value: 'SERVICE_PROMOTION', label: 'Service Promotion' },
  { value: 'FESTIVAL', label: 'Festival/Event' },
  { value: 'CUSTOM', label: 'Custom' },
];

export function CampaignWizard({ 
  templates, 
  offers 
}: { 
  templates: { id: string, name: string, content: string }[],
  offers: { id: string, name: string, discountPercent: any, discountAmount: any }[]
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    campaignType: 'PROMOTIONAL',
    offerId: 'none',
    templateId: '',
    audienceType: 'ALL' as AudienceFilter['type'],
    scheduleType: 'NOW',
    scheduleTime: '',
  });

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleEstimateAudience = async () => {
    setIsEstimating(true);
    try {
      const filter: AudienceFilter = { type: formData.audienceType };
      
      const count = await estimateAudienceSize(filter);
      setEstimatedSize(count);
    } catch (error: any) {
      toast.error(error.message || 'Failed to estimate audience');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const filter: AudienceFilter = { type: formData.audienceType };

      await createCampaign({
        name: formData.name,
        campaignType: formData.campaignType,
        templateId: formData.templateId,
        offerId: formData.offerId === 'none' ? undefined : formData.offerId,
        audienceFilter: filter,
        scheduleTime: formData.scheduleType === 'SCHEDULED' ? new Date(formData.scheduleTime) : undefined,
      });

      toast.success('Campaign created successfully');
      router.push('/dashboard/whatsapp/campaigns');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create campaign');
      setIsSubmitting(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === formData.templateId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Stepper */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        {[
          { num: 1, title: 'Details', icon: Megaphone },
          { num: 2, title: 'Audience', icon: Users },
          { num: 3, title: 'Message', icon: MessageSquare },
          { num: 4, title: 'Review', icon: Check }
        ].map((s) => (
          <div key={s.num} className={`flex items-center ${step === s.num ? 'text-indigo-600' : step > s.num ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step === s.num ? 'border-indigo-600 bg-indigo-50' : step > s.num ? 'border-green-600 bg-green-50' : 'border-gray-300'} mr-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm hidden sm:inline-block">{s.title}</span>
            {s.num < 4 && <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 1 && (
          <div className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => updateForm('name', e.target.value)} 
                placeholder="e.g. Diwali Special 2026"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Campaign Type</Label>
              <Select value={formData.campaignType} onValueChange={(v) => updateForm('campaignType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Attach Offer (Optional)</Label>
              <Select value={formData.offerId} onValueChange={(v) => updateForm('offerId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an offer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No offer attached</SelectItem>
                  {offers.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Attaching an offer will let you use the [[OFFER_CODE]] variable in your template.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Target Audience</h2>
            
            <div className="space-y-2">
              <Label>Audience Filter</Label>
              <Select 
                value={formData.audienceType} 
                onValueChange={(v) => {
                  updateForm('audienceType', v);
                  setEstimatedSize(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Active Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Estimated Reach</p>
                <p className="text-xs text-gray-500">Number of valid customers to receive this campaign.</p>
              </div>
              <div className="flex items-center gap-3">
                {estimatedSize !== null ? (
                  <span className="text-2xl font-bold text-indigo-600">{estimatedSize}</span>
                ) : (
                  <span className="text-gray-400 text-sm italic">Not calculated</span>
                )}
                <Button variant="outline" size="sm" onClick={handleEstimateAudience} disabled={isEstimating}>
                  {isEstimating ? 'Calculating...' : 'Estimate'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Message Content</h2>
            
            <div className="space-y-2">
              <Label>Select WhatsApp Template *</Label>
              <Select value={formData.templateId} onValueChange={(v) => updateForm('templateId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pre-approved template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="mt-6">
                <Label className="mb-2 block">Message Preview</Label>
                <div className="bg-[#EFEAE2] p-4 rounded-lg relative overflow-hidden">
                  <div className="bg-white p-3 rounded-md shadow-sm rounded-tr-none text-sm text-gray-800 whitespace-pre-wrap max-w-[85%] relative z-10">
                    {selectedTemplate.content}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Variables like [[CUSTOMER_NAME]] will be dynamically replaced when sending.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Review & Schedule</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium text-gray-900">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Audience:</span>
                <span className="font-medium text-gray-900">{formData.audienceType} {estimatedSize ? `(~${estimatedSize} recipients)` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Template:</span>
                <span className="font-medium text-gray-900">{selectedTemplate?.name || 'None'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Delivery Schedule</Label>
              <Select value={formData.scheduleType} onValueChange={(v) => updateForm('scheduleType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOW">Send Immediately</SelectItem>
                  <SelectItem value="SCHEDULED">Schedule for later</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scheduleType === 'SCHEDULED' && (
              <div className="space-y-2">
                <Label>Schedule Date & Time *</Label>
                <Input 
                  type="datetime-local" 
                  value={formData.scheduleTime} 
                  onChange={(e) => updateForm('scheduleTime', e.target.value)} 
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Navigation */}
      <div className="border-t border-gray-200 px-6 py-4 flex justify-between bg-gray-50 rounded-b-lg">
        <Button 
          variant="outline" 
          onClick={() => step === 1 ? router.push('/dashboard/whatsapp/campaigns') : setStep(s => s - 1)}
          disabled={isSubmitting}
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        
        {step < 4 ? (
          <Button 
            onClick={() => setStep(s => s + 1)}
            disabled={(step === 1 && !formData.name) || (step === 3 && !formData.templateId)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (formData.scheduleType === 'SCHEDULED' && !formData.scheduleTime)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? 'Processing...' : formData.scheduleType === 'SCHEDULED' ? 'Schedule Campaign' : 'Send Now'}
            {!isSubmitting && <Send className="w-4 h-4 ml-2" />}
          </Button>
        )}
      </div>
    </div>
  );
}
