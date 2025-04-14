import React, { useState, useRef, useEffect } from "react";
import { Input } from "./input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Loader2 } from "lucide-react";

interface AddressComponents {
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, components?: AddressComponents) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter an address",
  className,
  disabled = false,
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedInput, setDebouncedInput] = useState("");
  // Use environment variable for API key - fallback to passed value if env var not set
  const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "9ad670b345e5491a8e2593aa016959f3";

  // Debounce input to reduce API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInput(inputValue);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // Fetch suggestions when debounced input changes
  useEffect(() => {
    if (!debouncedInput || debouncedInput.length < 3) {
      setSuggestions([]);
      return;
    }

    async function fetchSuggestions() {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
            debouncedInput
          )}&format=json&limit=5&apiKey=${API_KEY}`
        );
        const data = await response.json();
        setSuggestions(data.results || []);
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, [debouncedInput, API_KEY]);

  const formatAddress = (result: any) => {
    const components = [];
    if (result.address_line1) components.push(result.address_line1);
    if (result.address_line2) components.push(result.address_line2);
    
    // If no address lines, construct from components
    if (components.length === 0) {
      if (result.housenumber) components.push(result.housenumber);
      if (result.street) components.push(result.street);
      if (result.city) components.push(result.city);
      if (result.state) components.push(result.state);
      if (result.postcode) components.push(result.postcode);
    }
    
    return components.join(", ");
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            if (!newValue) {
              onChange("");
            }
            setOpen(newValue.length > 0);
          }}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          onFocus={() => inputValue.length > 0 && setOpen(true)}
          onBlur={() => {
            // Small delay to allow selecting an item
            setTimeout(() => setOpen(false), 200);
          }}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      
      {open && suggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full">
          <Command className="border rounded-md shadow-md">
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {suggestions.map((result) => (
                  <CommandItem
                    key={result.place_id}
                    onSelect={() => {
                      const formattedAddress = formatAddress(result);
                      setInputValue(formattedAddress);
                      
                      // Extract address components
                      const streetAddress = [
                        result.housenumber, 
                        result.street
                      ].filter(Boolean).join(' ');
                      
                      const addressComponents: AddressComponents = {
                        streetAddress: streetAddress || undefined,
                        city: result.city || undefined,
                        state: result.state || undefined,
                        postalCode: result.postcode || undefined,
                        country: result.country || undefined,
                        fullAddress: formattedAddress
                      };
                      
                      onChange(formattedAddress, addressComponents);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    {formatAddress(result)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}