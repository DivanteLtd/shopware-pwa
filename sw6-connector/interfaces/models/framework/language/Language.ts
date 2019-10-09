import { Locale } from "../../system/locale/Locale";

import { LanguageCollection } from "./LanguageCollection";

import { SalesChannelCollection } from "../../system/sales-channel/SalesChannelCollection";

import CustomerCollection from "../../checkout/customer/CustomerCollection";

import { CategoryTranslationCollection } from "../../content/category/CategoryTranslationCollection";

import { CountryStateTranslationCollection } from "../../system/country/CountryStateTranslationCollection";

import { CurrencyTranslationCollection } from "../../system/currency/CurrencyTranslationCollection";

import { CustomerGroupTranslationCollection } from "../../checkout/customer/CustomerGroupTranslationCollection";

import { LocaleTranslationCollection } from "../../system/locale/LocaleTranslationCollection";

import { MediaTranslationCollection } from "../../content/media/MediaTranslationCollection";

import { PaymentMethodTranslationCollection } from "../../checkout/payment/PaymentMethodTranslationCollection";

import { ProductManufacturerTranslationCollection } from "../../content/product/ProductManufacturerTranslationCollection";

import { ProductTranslationCollection } from "../../content/product/ProductTranslationCollection";

import { ShippingMethodTranslationCollection } from "../../checkout/shipping/ShippingMethodTranslationCollection";

import { UnitTranslationCollection } from "../../system/unit/UnitTranslationCollection";

import { PropertyGroupTranslationCollection } from "../../content/property/PropertyGroupTranslationCollection";

import { PropertyGroupOptionTranslationCollection } from "../../content/property/PropertyGroupOptionTranslationCollection";

import { SalesChannelTranslationCollection } from "../../system/sales-channel/SalesChannelTranslationCollection";

import { SalesChannelTypeTranslationCollection } from "../../system/sales-channel/SalesChannelTypeTranslationCollection";

import { SalutationTranslationCollection } from "../../system/salutation/SalutationTranslationCollection";

import { SalesChannelDomainCollection } from "../../system/sales-channel/SalesChannelDomainCollection";

import { PluginTranslationCollection } from "../plugin/PluginTranslationCollection";

import { ProductStreamTranslationCollection } from "../../content/product-stream/ProductStreamTranslationCollection";

import { Collection } from "../struct/Collection";

import { MailTemplateCollection } from "../../content/mail-template/MailTemplateCollection";

import { MailHeaderFooterCollection } from "../../content/mail-template/MailHeaderFooterCollection";

import { DocumentTypeTranslationCollection } from "../../checkout/document/DocumentTypeTranslationCollection";

import { DeliveryTimeCollection } from "../../checkout/delivery/DeliveryTimeCollection";

import { NewsletterRecipientCollection } from "../../content/newsletter/NewsletterRecipientCollection";

import { OrderCollection } from "../../checkout/order/OrderCollection";

import { NumberRangeTypeTranslationCollection } from "../../system/number-range/NumberRangeTypeTranslationCollection";

import { ProductSearchKeywordCollection } from "../../content/product/ProductSearchKeywordCollection";

import { ProductKeywordDictionaryCollection } from "../../content/product/ProductKeywordDictionaryCollection";

import { MailTemplateTypeTranslationCollection } from "../../content/mail-template/MailTemplateTypeTranslationCollection";

import { NumberRangeTranslationCollection } from "../../system/number-range/NumberRangeTranslationCollection";

import { ProductReviewCollection } from "../../content/product/ProductReviewCollection";

import { PromotionTranslationCollection } from "../../checkout/promotion/PromotionTranslationCollection"}

export interface Language {
    parentId: string | null;
    localeId: string;
    translationCodeId: string | null;
    translationCode: Locale | null;
    name: string;
    locale: Locale | null;
    parent: Language | null;
    children: LanguageCollection | null;
    salesChannels: SalesChannelCollection | null;
    customers: CustomerCollection | null;
    salesChannelDefaultAssignments: SalesChannelCollection | null;
    customFields: [] | null;
    categoryTranslations: CategoryTranslationCollection | null;
    countryStateTranslations: CountryStateTranslationCollection | null;
    countryTranslations: CategoryTranslationCollection | null;
    currencyTranslations: CurrencyTranslationCollection | null;
    customerGroupTranslations: CustomerGroupTranslationCollection | null;
    localeTranslations: LocaleTranslationCollection | null;
    mediaTranslations: MediaTranslationCollection | null;
    paymentMethodTranslations: PaymentMethodTranslationCollection | null;
    productManufacturerTranslations: ProductManufacturerTranslationCollection | null;
    productTranslations: ProductTranslationCollection | null;
    shippingMethodTranslations: ShippingMethodTranslationCollection | null;
    unitTranslations: UnitTranslationCollection | null;
    propertyGroupTranslations: PropertyGroupTranslationCollection | null;
    propertyGroupOptionTranslations: PropertyGroupOptionTranslationCollection | null;
    salesChannelTranslations: SalesChannelTranslationCollection | null;
    salesChannelTypeTranslations: SalesChannelTypeTranslationCollection | null;
    salutationTranslations: SalutationTranslationCollection | null;
    salesChannelDomains: SalesChannelDomainCollection | null;
    pluginTranslations: PluginTranslationCollection | null;
    productStreamTranslations: ProductStreamTranslationCollection | null;
    stateMachineTranslations: Collection | null;
    stateMachineStateTranslations: Collection | null;
    cmsPageTranslation: Collection | null;
    cmsSlotTranslations: Collection | null;
    mailTemplateTranslations: MailTemplateCollection | null;
    mailHeaderFooterTranslation: MailHeaderFooterCollection | null;
    documentTypeTranslations: DocumentTypeTranslationCollection | null;
    deliveryTimeTranslations: DeliveryTimeCollection | null;
    newsletterRecipients: NewsletterRecipientCollection | null;
    orders: OrderCollection | null;
    numberRangeTypeTranslations: NumberRangeTypeTranslationCollection | null;
    productSearchKeywords: ProductSearchKeywordCollection | null;
    productKeywordDictionaries: ProductKeywordDictionaryCollection | null;
    mailTemplateTypeTranslations: MailTemplateTypeTranslationCollection | null;
    promotionTranslations: PromotionTranslationCollection | null;
    numberRangeTranslations: NumberRangeTranslationCollection | null;
    productReviews: ProductReviewCollection | null;
}

