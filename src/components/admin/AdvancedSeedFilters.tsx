
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Download } from 'lucide-react';

interface AdvancedSeedFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterSeverity: string;
  onFilterSeverityChange: (value: string) => void;
  onExport: () => void;
  onCreateNew: () => void;
  totalSeeds: number;
  filteredCount: number;
  activeCount: number;
}

const AdvancedSeedFilters: React.FC<AdvancedSeedFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterSeverity,
  onFilterSeverityChange,
  onExport,
  onCreateNew,
  totalSeeds,
  filteredCount,
  activeCount
}) => {
  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Input
            placeholder="Zoek seeds..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
          />
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">Alle types</option>
            <option value="validation">Validatie</option>
            <option value="reflection">Reflectie</option>
            <option value="suggestion">Suggestie</option>
            <option value="intervention">Interventie</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => onFilterSeverityChange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">Alle severity</option>
            <option value="low">Laag</option>
            <option value="medium">Gemiddeld</option>
            <option value="high">Hoog</option>
            <option value="critical">Kritiek</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onExport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </Button>
          <Button 
            onClick={onCreateNew}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Nieuwe Seed
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        {filteredCount} van {totalSeeds} seeds ({activeCount} actief)
      </div>
    </div>
  );
};

export default AdvancedSeedFilters;
