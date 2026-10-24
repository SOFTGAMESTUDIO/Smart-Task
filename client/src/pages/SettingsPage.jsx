import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sliders, Save, RotateCcw, Loader2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const SettingsPage = () => {
  const queryClient = useQueryClient();

  // Load categories and weights dynamically from backend
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.getCategories();
      return res.data || [];
    },
    staleTime: 1000 * 60,
  });

  // Mutation for updating category weight dynamically
  const weightMutation = useMutation({
    mutationFn: ({ id, weight }) => apiClient.updateCategoryWeight(id, weight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleWeightChange = (id, newWeight) => {
    weightMutation.mutate({ id, weight: Number(newWeight) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Priority Engine & Category Rules</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure how the deterministic priority engine weighs categories against hard deadlines and urgency
          </p>
        </div>
        <div className="flex items-center gap-2">
          {weightMutation.isSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}>
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Category Weight Sliders */}
      <Card elevated>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <CardTitle>User Category Weights (Scale 1 - 5)</CardTitle>
          </div>
          <Badge variant="primary">Deterministic Scoring Factor</Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xs text-slate-400">
            Higher weights boost recommendation score when multiple tasks have similar deadlines. Note that hard deadlines and delivery windows always take precedence over preference weights.
          </p>

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-2" />
              <p className="text-xs">Loading category configuration...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {categories.map((cat) => (
                <div key={cat.id || cat._id} className="space-y-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || '#3b82f6' }}
                      />
                      <span className="text-sm font-semibold text-slate-200">{cat.name}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                      Weight: {cat.weight} / 5
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={cat.weight}
                    onChange={(e) => handleWeightChange(cat.id || cat._id, e.target.value)}
                    className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 px-1">
                    <span>1 (Lowest)</span>
                    <span>3 (Normal)</span>
                    <span>5 (Highest)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
