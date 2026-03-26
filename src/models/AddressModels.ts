export interface AddressModel {
  id: string;
  name: string;
  phone?: string;
  label?: string;       // "Home", "Office", "Other"
  flatHouse: string;    // Address line 1
  area: string;         // Address line 2 / locality
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault?: boolean;
}
