import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { maskCNPJ, maskPhone } from './utils';

export const Card = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="card">
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="card-value">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

export const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", isDestructive = false }: any) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-full ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    </div>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={onCancel} 
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={onConfirm} 
                            className={`px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-sm ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SearchableSelect = ({ options, value, onChange, placeholder, required }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && options) {
      const selectedOption = options.find((opt: any) => String(opt.value) === String(value));
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
      }
    } else if (!value) {
        setSearchTerm('');
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        if (value && options) {
             const selected = options.find((opt: any) => String(opt.value) === String(value));
             if (selected) setSearchTerm(selected.label);
        } else {
             setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  const filteredOptions = options?.filter((opt: any) => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: any) => {
    onChange(option.value);
    setSearchTerm(option.label);
    setIsOpen(false);
  };

  const handleInputChange = (e: any) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (e.target.value === '') {
        onChange('');
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          required={required && !value}
          className="w-full border border-gray-300 rounded p-2 pr-8 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder={placeholder || "Selecione..."}
          value={searchTerm}
          onChange={handleInputChange}
          onClick={() => setIsOpen(true)}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
           <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions && filteredOptions.length > 0 ? (
            filteredOptions.map((opt: any) => (
              <div
                key={opt.value}
                className={`px-4 py-2 cursor-pointer hover:bg-emerald-50 text-sm ${String(value) === String(opt.value) ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-gray-700'}`}
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Nenhuma opção encontrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SimpleForm = ({ title, fields, onSubmit, onClose, initialValues = {} }: any) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (initialValues) {
        setFormData({ ...initialValues });
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    let finalValue = value;
    if (field === 'cnpj') finalValue = maskCNPJ(value);
    else if (field === 'telefone') finalValue = maskPhone(value);

    // Limpar campos dependentes se o valor mudar
    setFormData((prev: any) => {
        const newState = { ...prev, [field]: finalValue };
        
        // Exemplo: Se mudar o tipo, limpa as associações para evitar inconsistência
        if (field === 'tipo') {
            newState['funcionario_id'] = null;
            newState['fornecedor_id'] = null;
        }
        return newState;
    });
  };

  const handleCheckboxGroupChange = (field: string, optionValue: string, checked: boolean) => {
    setFormData((prev: any) => {
        const currentValues = prev[field] || [];
        if (checked) return { ...prev, [field]: [...currentValues, optionValue] };
        else return { ...prev, [field]: currentValues.filter((v: string) => v !== optionValue) };
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 bg-emerald-600 flex justify-between items-center">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-white hover:text-emerald-200 font-bold text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {fields.map((field: any) => {
            // Lógica Condicional
            if (field.showIf) {
                const dependentValue = formData[field.showIf.field];
                if (dependentValue !== field.showIf.value) {
                    return null;
                }
            }

            return (
                <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                
                {field.type === 'select' ? (
                    <SearchableSelect 
                        options={field.options}
                        value={formData[field.name]}
                        onChange={(val: any) => handleChange(field.name, val)}
                        placeholder="Digite para buscar..."
                        required={field.required}
                    />
                ) : field.type === 'checkbox-group' ? (
                    <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-200">
                        {field.options?.map((opt: any) => (
                            <label key={opt.value} className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    value={opt.value}
                                    checked={formData[field.name]?.includes(opt.value)}
                                    onChange={(e) => handleCheckboxGroupChange(field.name, opt.value, e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                />
                                <span className="text-sm text-gray-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <input
                    type={field.type || 'text'}
                    required={field.required}
                    value={formData[field.name] || ''}
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    maxLength={field.name === 'cnpj' ? 18 : field.name === 'telefone' ? 15 : undefined}
                    />
                )}
                </div>
            );
          })}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};