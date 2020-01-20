import { PaymentMethod } from "./PaymentMethod";
import { CustomField } from "../../common/CustomField";

/**
 * @alpha
 */
export interface PaymentMethodTranslation {
  paymentMethodId: string;
  name: string | null;
  description: string | null;
  paymentMethod: PaymentMethod | null;
  customFields: CustomField[];
}
