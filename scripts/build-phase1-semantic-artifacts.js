const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const p1Dir = path.join(rootDir, 'workspace', 'phase-1-understanding');

// 1. Comprehensive Physical Data Model Dictionary
const datasetDefinitions = {
  "RAW.CUSTOMERS": {
    producerStepId: "STEP-006",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "status", type: "CHAR", length: 12, semanticRole: "FILTER" }
    ]
  },
  "RAW.PRODUCTS": {
    producerStepId: "STEP-008",
    variables: [
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_name", type: "CHAR", length: 100, semanticRole: "DIMENSION" },
      { name: "category", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "subcategory", type: "CHAR", length: 40, semanticRole: "DIMENSION" }
    ]
  },
  "RAW.SALES": {
    producerStepId: "STEP-010",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.ACTIVITY_MATRIX": {
    producerStepId: "STEP-088",
    variables: [
      { name: "activity_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "recency_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.ACTIVITY_SUMMARY": {
    producerStepId: "STEP-089",
    variables: [
      { name: "activity_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "recency_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "_TYPE_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "_FREQ_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" },
      { name: "average_active_days", type: "NUM", semanticRole: "DERIVED_METRIC" }
    ]
  },
  "WORKLIB.AUDIT_EXTRACT": {
    producerStepId: "STEP-042",
    variables: [
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "average_sale", type: "NUM", semanticRole: "MEASURE" },
      { name: "units", type: "NUM", semanticRole: "MEASURE" },
      { name: "audit_timestamp", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "audit_source", type: "CHAR", length: 30, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.CATEGORY_DEMAND_FREQ": {
    producerStepId: "STEP-075",
    variables: [
      { name: "category", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "demand_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.CATEGORY_DEMAND_SUMMARY": {
    producerStepId: "STEP-074",
    variables: [
      { name: "category", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "demand_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "_TYPE_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "_FREQ_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "units", type: "NUM", semanticRole: "MEASURE" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.CHANNEL_FREQ": {
    producerStepId: "STEP-017",
    variables: [
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.CUSTOMER_ACTIVITY": {
    producerStepId: "STEP-085",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "first_sale", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "last_sale", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "active_days", type: "NUM", semanticRole: "MEASURE" },
      { name: "transaction_count", type: "NUM", semanticRole: "MEASURE" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "activity_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "recency_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.CUSTOMER_BASE": {
    producerStepId: "STEP-006",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "status", type: "CHAR", length: 12, semanticRole: "FILTER" },
      { name: "account_year", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.CUSTOMER_FLAGS": {
    producerStepId: "STEP-030",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_tier", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "total_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "transaction_count", type: "NUM", semanticRole: "MEASURE" },
      { name: "high_value_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "frequent_shopper_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "dormant_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.CUSTOMER_FLAGS_SORTED": {
    producerStepId: "STEP-031",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_tier", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "total_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "transaction_count", type: "NUM", semanticRole: "MEASURE" },
      { name: "high_value_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "frequent_shopper_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "dormant_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ],
    sortKeys: [
      { name: "region", direction: "ASC" },
      { name: "customer_tier", direction: "ASC" },
      { name: "total_sales", direction: "DESC" }
    ]
  },
  "WORKLIB.CUSTOMER_KPIS": {
    producerStepId: "STEP-023",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "units", type: "NUM", semanticRole: "MEASURE" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" },
      { name: "avg_unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "max_single_sale", type: "NUM", semanticRole: "MEASURE" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.CUSTOMER_LOOKUP": {
    producerStepId: "STEP-097",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.CUSTOMER_MONTHLY": {
    producerStepId: "STEP-014",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_status", type: "CHAR", length: 12, semanticRole: "FILTER" },
      { name: "customer_segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "customer_total", type: "NUM", semanticRole: "ACCUMULATOR" },
      { name: "transaction_count", type: "NUM", semanticRole: "ACCUMULATOR" }
    ]
  },
  "WORKLIB.CUSTOMER_SALES": {
    producerStepId: "STEP-012",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "status", type: "CHAR", length: 12, semanticRole: "FILTER" },
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "gross_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "discount_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "net_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "in_customer", type: "NUM", semanticRole: "FILTER" },
      { name: "in_sale", type: "NUM", semanticRole: "FILTER" }
    ]
  },
  "WORKLIB.CUSTOMER_SALES_SORTED": {
    producerStepId: "STEP-013",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "status", type: "CHAR", length: 12, semanticRole: "FILTER" },
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "gross_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "discount_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "net_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ],
    sortKeys: [{ name: "customer_id", direction: "ASC" }]
  },
  "WORKLIB.CUSTOMER_SCORING": {
    producerStepId: "STEP-063",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "spend_score", type: "NUM", semanticRole: "MEASURE" },
      { name: "frequency_score", type: "NUM", semanticRole: "MEASURE" },
      { name: "composite_score", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "score_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.CUSTOMER_SORTED": {
    producerStepId: "STEP-007",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "status", type: "CHAR", length: 12, semanticRole: "FILTER" }
    ],
    sortKeys: [{ name: "customer_id", direction: "ASC" }]
  },
  "WORKLIB.CUSTOMER_TIER": {
    producerStepId: "STEP-025",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "units", type: "NUM", semanticRole: "MEASURE" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" },
      { name: "customer_tier", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "loyalty_score", type: "NUM", semanticRole: "DERIVED_METRIC" }
    ]
  },
  "WORKLIB.CUSTOMER_TIER_SORTED": {
    producerStepId: "STEP-026",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "units", type: "NUM", semanticRole: "MEASURE" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" },
      { name: "customer_tier", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "loyalty_score", type: "NUM", semanticRole: "DERIVED_METRIC" }
    ],
    sortKeys: [{ name: "customer_id", direction: "ASC" }]
  },
  "WORKLIB.DAILY_SALES": {
    producerStepId: "STEP-027",
    variables: [
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "daily_total", type: "NUM", semanticRole: "MEASURE" },
      { name: "daily_count", type: "NUM", semanticRole: "MEASURE" },
      { name: "running_monthly_total", type: "NUM", semanticRole: "ACCUMULATOR" }
    ]
  },
  "WORKLIB.DAILY_SALES_PIVOT": {
    producerStepId: "STEP-029",
    variables: [
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "_NAME_", type: "CHAR", length: 32, semanticRole: "DIMENSION" },
      { name: "daily_total", type: "NUM", semanticRole: "MEASURE" },
      { name: "daily_count", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.DAILY_SALES_SORTED": {
    producerStepId: "STEP-028",
    variables: [
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "daily_total", type: "NUM", semanticRole: "MEASURE" },
      { name: "daily_count", type: "NUM", semanticRole: "MEASURE" },
      { name: "running_monthly_total", type: "NUM", semanticRole: "ACCUMULATOR" }
    ],
    sortKeys: [{ name: "sale_date", direction: "ASC" }]
  },
  "WORKLIB.DELIVERY_MANIFEST": {
    producerStepId: "STEP-052",
    variables: [
      { name: "manifest_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "destination_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "total_packages", type: "NUM", semanticRole: "MEASURE" },
      { name: "manifest_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.ENGAGEMENT_SUMMARY": {
    producerStepId: "STEP-061",
    variables: [
      { name: "customer_tier", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "_TYPE_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "_FREQ_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "avg_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "avg_orders", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.ENRICHED_SALES": {
    producerStepId: "STEP-019",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_name", type: "CHAR", length: 100, semanticRole: "DIMENSION" },
      { name: "category", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "subcategory", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "gross_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "discount_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "net_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "value_band", type: "CHAR", length: 10, semanticRole: "DIMENSION" },
      { name: "pricing_band", type: "CHAR", length: 12, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.EXCEPTION_COUNTS": {
    producerStepId: "STEP-049",
    variables: [
      { name: "exception_code", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.EXCEPTION_EXTRACT": {
    producerStepId: "STEP-048",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "net_amount", type: "NUM", semanticRole: "MEASURE" },
      { name: "exception_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "exception_code", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "exception_severity", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.EXCEPTION_SUMMARY": {
    producerStepId: "STEP-050",
    variables: [
      { name: "exception_code", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "exception_count", type: "NUM", semanticRole: "MEASURE" },
      { name: "total_severity", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.FINAL_CONTROL_REPORT": {
    producerStepId: "STEP-062",
    variables: [
      { name: "report_section", type: "CHAR", length: 30, semanticRole: "DIMENSION" },
      { name: "metric_name", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "metric_value", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.FINAL_CONTROL_TOTALS": {
    producerStepId: "STEP-043",
    variables: [
      { name: "total_records", type: "NUM", semanticRole: "MEASURE" },
      { name: "total_sales_amount", type: "NUM", semanticRole: "MEASURE" },
      { name: "avg_ticket", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.FINAL_CUSTOMER_PROFILE": {
    producerStepId: "STEP-058",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "total_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "total_units", type: "NUM", semanticRole: "MEASURE" },
      { name: "total_orders", type: "NUM", semanticRole: "MEASURE" },
      { name: "customer_tier", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "profile_status", type: "CHAR", length: 12, semanticRole: "FILTER" }
    ]
  },
  "WORKLIB.FINAL_SALES_EXTRACT": {
    producerStepId: "STEP-039",
    variables: [
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "average_sale", type: "NUM", semanticRole: "MEASURE" },
      { name: "units", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.HIGH_VALUE_CUSTOMER": {
    producerStepId: "STEP-057",
    variables: [
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "high_value_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "high_value_orders", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.HIGH_VALUE_SALES": {
    producerStepId: "STEP-056",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_name", type: "CHAR", length: 100, semanticRole: "DIMENSION" },
      { name: "category", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "subcategory", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "gross_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "discount_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "net_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "value_band", type: "CHAR", length: 10, semanticRole: "DIMENSION" },
      { name: "pricing_band", type: "CHAR", length: 12, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.LOOKUP_STATUS_COUNTS": {
    producerStepId: "STEP-099",
    variables: [
      { name: "lookup_status", type: "CHAR", length: 12, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.MANAGEMENT_SUMMARY": {
    producerStepId: "STEP-051",
    variables: [
      { name: "report_metric", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "metric_value", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.METADATA_SNAPSHOT": {
    producerStepId: "STEP-041",
    variables: [
      { name: "dataset_name", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "nobs", type: "NUM", semanticRole: "MEASURE" },
      { name: "nvar", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.MONTH_REGION_RANKED": {
    producerStepId: "STEP-080",
    variables: [
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "fiscal_year", type: "NUM", semanticRole: "DIMENSION" },
      { name: "period_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "period_units", type: "NUM", semanticRole: "MEASURE" },
      { name: "regional_sales_rank", type: "NUM", semanticRole: "DERIVED_METRIC" }
    ]
  },
  "WORKLIB.MONTH_REGION_SUMMARY": {
    producerStepId: "STEP-078",
    variables: [
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "fiscal_year", type: "NUM", semanticRole: "DIMENSION" },
      { name: "_TYPE_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "_FREQ_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "period_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "period_units", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.OPERATIONAL_DASHBOARD": {
    producerStepId: "STEP-102",
    variables: [
      { name: "sales_rows", type: "NUM", semanticRole: "MEASURE" },
      { name: "total_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "customers", type: "NUM", semanticRole: "MEASURE" },
      { name: "products", type: "NUM", semanticRole: "MEASURE" },
      { name: "review_items", type: "NUM", semanticRole: "MEASURE" },
      { name: "duplicate_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "invalid_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "overall_status", type: "CHAR", length: 15, semanticRole: "FILTER" },
      { name: "report_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.PRODUCT_BASE": {
    producerStepId: "STEP-008",
    variables: [
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_name", type: "CHAR", length: 100, semanticRole: "DIMENSION" },
      { name: "category", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "subcategory", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "active_flag", type: "CHAR", length: 1, semanticRole: "FILTER" }
    ]
  },
  "WORKLIB.PRODUCT_KPIS": {
    producerStepId: "STEP-024",
    variables: [
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_name", type: "CHAR", length: 100, semanticRole: "DIMENSION" },
      { name: "category", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "subcategory", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "units_sold", type: "NUM", semanticRole: "MEASURE" },
      { name: "total_revenue", type: "NUM", semanticRole: "MEASURE" },
      { name: "distinct_customers", type: "NUM", semanticRole: "MEASURE" },
      { name: "avg_price_realized", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.PRODUCT_PERFORMANCE": {
    producerStepId: "STEP-071",
    variables: [
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_name", type: "CHAR", length: 100, semanticRole: "DIMENSION" },
      { name: "category", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "units", type: "NUM", semanticRole: "MEASURE" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" },
      { name: "demand_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.PRODUCT_SORTED": {
    producerStepId: "STEP-009",
    variables: [
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_name", type: "CHAR", length: 100, semanticRole: "DIMENSION" },
      { name: "category", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "subcategory", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "active_flag", type: "CHAR", length: 1, semanticRole: "FILTER" }
    ],
    sortKeys: [{ name: "product_id", direction: "ASC" }]
  },
  "WORKLIB.QUALITY_CONTROL": {
    producerStepId: "STEP-084",
    variables: [
      { name: "quality_status", type: "CHAR", length: 12, semanticRole: "DIMENSION" },
      { name: "records", type: "NUM", semanticRole: "MEASURE" },
      { name: "record_pct", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.QUARTER_REGION_SUMMARY": {
    producerStepId: "STEP-079",
    variables: [
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "fiscal_quarter", type: "CHAR", length: 8, semanticRole: "DIMENSION" },
      { name: "_TYPE_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "_FREQ_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "quarter_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "quarter_units", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.RECONCILIATION": {
    producerStepId: "STEP-044",
    variables: [
      { name: "expected_rows", type: "NUM", semanticRole: "MEASURE" },
      { name: "expected_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "actual_rows", type: "NUM", semanticRole: "MEASURE" },
      { name: "actual_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "reconciliation_status", type: "CHAR", length: 20, semanticRole: "FILTER" },
      { name: "diff_sales", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.REGION_CHANGE_SUMMARY": {
    producerStepId: "STEP-096",
    variables: [
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "_TYPE_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "_FREQ_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "net_change", type: "NUM", semanticRole: "MEASURE" },
      { name: "maximum_change", type: "NUM", semanticRole: "MEASURE" },
      { name: "minimum_change", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.REGION_CHANNEL_FREQ": {
    producerStepId: "STEP-017",
    variables: [
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.REGION_CHANNEL_SUMMARY": {
    producerStepId: "STEP-015",
    variables: [
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "_TYPE_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "_FREQ_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "total_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "total_quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "avg_sale", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.REGION_CONTROLS": {
    producerStepId: "STEP-090",
    variables: [
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" },
      { name: "average_sale", type: "NUM", semanticRole: "MEASURE" },
      { name: "units", type: "NUM", semanticRole: "MEASURE" },
      { name: "control_flag", type: "CHAR", length: 12, semanticRole: "FILTER" },
      { name: "control_reason", type: "CHAR", length: 100, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.REGION_CONTROL_COUNTS": {
    producerStepId: "STEP-091",
    variables: [
      { name: "control_flag", type: "CHAR", length: 12, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.REGION_CONTROL_DETAIL": {
    producerStepId: "STEP-092",
    variables: [
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" },
      { name: "average_sale", type: "NUM", semanticRole: "MEASURE" },
      { name: "control_flag", type: "CHAR", length: 12, semanticRole: "FILTER" },
      { name: "control_reason", type: "CHAR", length: 100, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.REGION_CUSTOMER_SCORE": {
    producerStepId: "STEP-068",
    variables: [
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "score_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "customer_count", type: "NUM", semanticRole: "MEASURE" },
      { name: "total_spend", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.REGION_CUSTOMER_SCORE_FLAGS": {
    producerStepId: "STEP-069",
    variables: [
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "score_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "customer_count", type: "NUM", semanticRole: "MEASURE" },
      { name: "total_spend", type: "NUM", semanticRole: "MEASURE" },
      { name: "priority_flag", type: "CHAR", length: 12, semanticRole: "FILTER" }
    ]
  },
  "WORKLIB.REGION_REPORT": {
    producerStepId: "STEP-038",
    variables: [
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "transactions", type: "NUM", semanticRole: "MEASURE" },
      { name: "sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "average_sale", type: "NUM", semanticRole: "MEASURE" },
      { name: "units", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.REGION_REPORT_INPUT": {
    producerStepId: "STEP-034",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "customer_region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_name", type: "CHAR", length: 100, semanticRole: "DIMENSION" },
      { name: "category", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "subcategory", type: "CHAR", length: 40, semanticRole: "DIMENSION" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "gross_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "discount_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "net_amount", type: "NUM", semanticRole: "DERIVED_METRIC" }
    ]
  },
  "WORKLIB.REGION_RUNNING_SALES": {
    producerStepId: "STEP-093",
    variables: [
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "running_sales", type: "NUM", semanticRole: "ACCUMULATOR" },
      { name: "running_units", type: "NUM", semanticRole: "ACCUMULATOR" },
      { name: "previous_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "sales_change", type: "NUM", semanticRole: "DERIVED_METRIC" }
    ]
  },
  "WORKLIB.REGION_SUMMARY": {
    producerStepId: "STEP-016",
    variables: [
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "_TYPE_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "_FREQ_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "mean_net", type: "NUM", semanticRole: "MEASURE" },
      { name: "std_net", type: "NUM", semanticRole: "MEASURE" },
      { name: "min_net", type: "NUM", semanticRole: "MEASURE" },
      { name: "max_net", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.REGION_SUMMARY_WIDE": {
    producerStepId: "STEP-018",
    variables: [
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "_NAME_", type: "CHAR", length: 32, semanticRole: "DIMENSION" },
      { name: "channel_ONLINE", type: "NUM", semanticRole: "MEASURE" },
      { name: "channel_RETAIL", type: "NUM", semanticRole: "MEASURE" },
      { name: "channel_PARTNER", type: "NUM", semanticRole: "MEASURE" },
      { name: "channel_WHOLESALE", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.REGION_TIER_FREQ": {
    producerStepId: "STEP-033",
    variables: [
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "customer_tier", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.REVIEW_QUEUE": {
    producerStepId: "STEP-021",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "net_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "high_value_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "anomaly_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "review_reason", type: "CHAR", length: 50, semanticRole: "DIMENSION" }
    ],
    sortKeys: [{ name: "sale_id", direction: "ASC" }]
  },
  "WORKLIB.REVIEW_QUEUE_FINAL": {
    producerStepId: "STEP-022",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "net_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "high_value_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "anomaly_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "review_reason", type: "CHAR", length: 50, semanticRole: "DIMENSION" },
      { name: "priority_level", type: "CHAR", length: 10, semanticRole: "FILTER" },
      { name: "audit_timestamp", type: "NUM", semanticRole: "DERIVED_METRIC" }
    ]
  },
  "WORKLIB.SALES_BASE": {
    producerStepId: "STEP-010",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "gross_amount", type: "NUM", format: "comma14.2", semanticRole: "DERIVED_METRIC" },
      { name: "discount_amount", type: "NUM", format: "comma14.2", semanticRole: "DERIVED_METRIC" },
      { name: "net_amount", type: "NUM", format: "comma14.2", semanticRole: "DERIVED_METRIC" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.SALES_DUPLICATE_CHECK": {
    producerStepId: "STEP-081",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ],
    sortKeys: [{ name: "sale_id", direction: "ASC" }]
  },
  "WORKLIB.SALES_DUPLICATES": {
    producerStepId: "STEP-081",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.SALES_LOOKUP_ENRICHED": {
    producerStepId: "STEP-098",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "net_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "customer_name", type: "CHAR", length: 80, semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "lookup_status", type: "CHAR", length: 12, semanticRole: "FILTER" }
    ]
  },
  "WORKLIB.SALES_PERIOD_FLAGS": {
    producerStepId: "STEP-076",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "net_amount", type: "NUM", semanticRole: "MEASURE" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "period_flag", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "fiscal_quarter", type: "CHAR", length: 8, semanticRole: "DIMENSION" },
      { name: "fiscal_year", type: "NUM", semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.SALES_QUALITY": {
    producerStepId: "STEP-082",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "quality_status", type: "CHAR", length: 12, semanticRole: "FILTER" },
      { name: "quality_reason", type: "CHAR", length: 50, semanticRole: "DIMENSION" },
      { name: "net_amount", type: "NUM", semanticRole: "DERIVED_METRIC" }
    ]
  },
  "WORKLIB.SALES_QUALITY_COUNTS": {
    producerStepId: "STEP-083",
    variables: [
      { name: "quality_status", type: "CHAR", length: 12, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.SALES_RULES": {
    producerStepId: "STEP-020",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "net_amount", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "high_value_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "anomaly_flag", type: "CHAR", length: 1, semanticRole: "FILTER" },
      { name: "review_reason", type: "CHAR", length: 50, semanticRole: "DIMENSION" }
    ]
  },
  "WORKLIB.SALES_SORTED": {
    producerStepId: "STEP-011",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "customer_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "product_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "quantity", type: "NUM", semanticRole: "MEASURE" },
      { name: "unit_price", type: "NUM", semanticRole: "MEASURE" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "gross_amount", type: "NUM", format: "comma14.2", semanticRole: "DERIVED_METRIC" },
      { name: "discount_amount", type: "NUM", format: "comma14.2", semanticRole: "DERIVED_METRIC" },
      { name: "net_amount", type: "NUM", format: "comma14.2", semanticRole: "DERIVED_METRIC" },
      { name: "sale_date", type: "NUM", format: "date9.", semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "channel", type: "CHAR", length: 20, semanticRole: "DIMENSION" }
    ],
    sortKeys: [
      { name: "customer_id", direction: "ASC" },
      { name: "sale_date", direction: "ASC" },
      { name: "sale_id", direction: "ASC" }
    ]
  },
  "WORKLIB.SCORE_DISTRIBUTION": {
    producerStepId: "STEP-065",
    variables: [
      { name: "score_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.SCORE_SUMMARY": {
    producerStepId: "STEP-066",
    variables: [
      { name: "score_band", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "_TYPE_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "_FREQ_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "mean_score", type: "NUM", semanticRole: "MEASURE" },
      { name: "min_score", type: "NUM", semanticRole: "MEASURE" },
      { name: "max_score", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.SEGMENT_RANKED": {
    producerStepId: "STEP-047",
    variables: [
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "segment_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "segment_records", type: "NUM", semanticRole: "MEASURE" },
      { name: "segment_units", type: "NUM", semanticRole: "MEASURE" },
      { name: "generated_rank", type: "NUM", semanticRole: "DERIVED_METRIC" }
    ]
  },
  "WORKLIB.SEGMENT_ROLLUP": {
    producerStepId: "STEP-045",
    variables: [
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "segment_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "segment_records", type: "NUM", semanticRole: "MEASURE" },
      { name: "segment_units", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.SEGMENT_ROLLUP_SORTED": {
    producerStepId: "STEP-046",
    variables: [
      { name: "segment", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "segment_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "segment_records", type: "NUM", semanticRole: "MEASURE" },
      { name: "segment_units", type: "NUM", semanticRole: "MEASURE" }
    ],
    sortKeys: [{ name: "segment", direction: "ASC" }]
  },
  "WORKLIB.SEMANTIC_EDGE_CASES": {
    producerStepId: "STEP-100",
    variables: [
      { name: "sale_id", type: "NUM", semanticRole: "BUSINESS_IDENTIFIER" },
      { name: "discount_pct", type: "NUM", semanticRole: "MEASURE" },
      { name: "missing_class", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "conversion_flag", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "character_amount", type: "CHAR", length: 14, semanticRole: "DIMENSION" },
      { name: "numeric_from_text", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "net_amount", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.SEMANTIC_EDGE_COUNTS": {
    producerStepId: "STEP-101",
    variables: [
      { name: "missing_class", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "conversion_flag", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.TIER_ACTIVITY_FREQ": {
    producerStepId: "STEP-033",
    variables: [
      { name: "customer_tier", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "COUNT", type: "NUM", semanticRole: "MEASURE" },
      { name: "PERCENT", type: "NUM", semanticRole: "MEASURE" }
    ]
  },
  "WORKLIB.TIER_SUMMARY": {
    producerStepId: "STEP-032",
    variables: [
      { name: "customer_tier", type: "CHAR", length: 15, semanticRole: "DIMENSION" },
      { name: "region", type: "CHAR", length: 20, semanticRole: "DIMENSION" },
      { name: "_TYPE_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "_FREQ_", type: "NUM", semanticRole: "DERIVED_METRIC" },
      { name: "tier_sales", type: "NUM", semanticRole: "MEASURE" },
      { name: "tier_transactions", type: "NUM", semanticRole: "MEASURE" }
    ]
  }
};

// Build physical-data-model.json
const existingModel = JSON.parse(fs.readFileSync(path.join(p1Dir, 'physical-data-model.json'), 'utf8'));
let totalFieldCount = 0;

const updatedDatasets = existingModel.datasets.map((d, dIdx) => {
  const def = datasetDefinitions[d.datasetName.toUpperCase()] || datasetDefinitions[d.datasetName];
  if (!def) {
    console.error('No definition for dataset:', d.datasetName);
    return d;
  }

  const variables = def.variables.map((v, vIdx) => {
    totalFieldCount++;
    const fieldObj = {
      fieldId: `FIELD-${String(totalFieldCount).padStart(4, '0')}`,
      name: v.name,
      type: v.type,
      semanticRole: v.semanticRole
    };
    if (v.length) fieldObj.length = v.length;
    if (v.format) fieldObj.format = v.format;
    return fieldObj;
  });

  const updated = {
    datasetId: d.datasetId,
    datasetName: d.datasetName,
    library: d.library,
    isPermanent: d.isPermanent,
    schemaStatus: d.schemaStatus,
    producerStepId: def.producerStepId || d.producerStepId,
    variables: variables
  };
  if (def.sortKeys) updated.sortKeys = def.sortKeys;
  return updated;
});

fs.writeFileSync(path.join(p1Dir, 'physical-data-model.json'), JSON.stringify({ datasets: updatedDatasets }, null, 2));
console.log(`Updated physical-data-model.json with ${updatedDatasets.length} datasets and ${totalFieldCount} authentic variables.`);

// 2. Updated and Expanded SAS Traps Ledger
const updatedTraps = {
  traps: [
    {
      trapId: "TRAP-001",
      stepId: "STEP-010",
      category: "MISSING_VALUE_COMPARISON",
      line: 83,
      description: "SAS numeric missing (.) is mathematically smaller than negative infinity; quantity < 0 evaluates to TRUE when quantity is missing.",
      mitigation: "In COBOL, explicitly check for missing/null status before evaluating numeric inequalities."
    },
    {
      trapId: "TRAP-002",
      stepId: "STEP-100",
      category: "SPECIAL_MISSING_VALUES",
      line: 978,
      description: "Special missing values .A and .Z are checked in discount_pct classification; COBOL standard lacks native special missings.",
      mitigation: "Map special missing values to distinct alphanumeric status indicators or dedicated 88-level condition names."
    },
    {
      trapId: "TRAP-003",
      stepId: "STEP-014",
      category: "IMPLICIT_RETAIN",
      line: 123,
      description: "SUM statement (customer_total + net_amount) automatically creates an implicit RETAIN and initializes to zero across DATA step iterations.",
      mitigation: "Declare explicit accumulator in WORKING-STORAGE and initialize to zero at control break header."
    },
    {
      trapId: "TRAP-004",
      stepId: "STEP-100",
      category: "TYPE_COERCION",
      line: 983,
      description: "Explicit PUT and INPUT functions coerce numeric to formatted string and text back to numeric with potential rounding discrepancies.",
      mitigation: "Utilize COBOL edited PIC clauses and FUNCTION NUMVAL-C with explicit precision guards."
    },
    {
      trapId: "TRAP-005",
      stepId: "STEP-012",
      category: "MERGE_WITHOUT_BY",
      line: 101,
      description: "Match-merge requires strict ascending order on BY key customer_id; customer_sales requires both inputs pre-sorted.",
      mitigation: "Implement sequential two-file match-merge loop using HIGH-VALUES sentinel key handling."
    },
    {
      trapId: "TRAP-006",
      stepId: "STEP-012",
      category: "DUPLICATE_KEY_CARDINALITY",
      line: 101,
      description: "One-to-many relationship between customer and sales preserves customer fields across multiple sales records in SAS PDV.",
      mitigation: "Implement master-transaction loop retaining master record in storage across transaction stream."
    },
    {
      trapId: "TRAP-007",
      stepId: "STEP-012",
      category: "IN_FLAG_INDICATORS",
      line: 104,
      description: "IN= variables (in_customer, in_sale) emulate inner join filter (if in_customer and in_sale).",
      mitigation: "Evaluate match status in match-merge loop: process output only when master-key = transaction-key."
    },
    {
      trapId: "TRAP-008",
      stepId: "STEP-014",
      category: "PDV_RESET_ANOMALY",
      line: 118,
      description: "Non-retained attributes in DATA step with OUTPUT on LAST.variable reflect values from the last observation, not the first.",
      mitigation: "Explicitly capture first-observation attributes in WORKING-STORAGE upon FIRST.key control break."
    },
    {
      trapId: "TRAP-009",
      stepId: "STEP-001",
      category: "DATE_EPOCH_OFFSET",
      line: 9,
      description: "SAS date values are integer offsets since Jan 1, 1960; date functions intnx and intck operate on this epoch.",
      mitigation: "Convert SAS date integers to Gregorian YYYYMMDD or Lilian dates via Language Environment date callable services (CEEDAYS/CEEDATE)."
    },
    {
      trapId: "TRAP-010",
      stepId: "STEP-006",
      category: "FIRST_LAST_GROUPING",
      line: 50,
      description: "FIRST.customer_id is referenced without a corresponding BY customer_id statement in WORKLIB.customer_base, causing SAS compile failure.",
      mitigation: "Flag as source defect; in COBOL, either require upstream sort and control break or treat as unanchored logic."
    },
    {
      trapId: "TRAP-011",
      stepId: "STEP-044",
      category: "MULTIPLE_SET_STATEMENTS",
      line: 401,
      description: "Conditional SET executed only on _N_=1 without an unconditional SET or STOP causes an infinite execution loop in SAS.",
      mitigation: "Read single-record control file once in initialization paragraph and terminate batch loop explicitly."
    },
    {
      trapId: "TRAP-012",
      stepId: "STEP-044",
      category: "AUTOMATIC_VARIABLES",
      line: 401,
      description: "_N_ iteration counter used to trigger header record loading; _N_ is dropped from output dataset automatically.",
      mitigation: "Implement internal record counter in WORKING-STORAGE."
    },
    {
      trapId: "TRAP-013",
      stepId: "STEP-014",
      category: "IMPLICIT_VS_EXPLICIT_OUTPUT",
      line: 125,
      description: "Explicit OUTPUT on LAST.customer_id suppresses default implicit output at bottom of DATA step, writing only summary rows.",
      mitigation: "Emit summary record only inside control-break finalization paragraph; omit record emission in detail paragraph."
    },
    {
      trapId: "TRAP-014",
      stepId: "STEP-010",
      category: "FORMAT_VS_INFORMAT_CONVERSION",
      line: 78,
      description: "Variables formatted with comma14.2 and date9. alter display representation without altering internal binary/float representation.",
      mitigation: "Store numeric values in COMP-3 (packed decimal) and format into display structures for output."
    },
    {
      trapId: "TRAP-015",
      stepId: "STEP-060",
      category: "WORK_DATASET_OVERWRITE",
      line: 534,
      description: "WORKLIB.final_customer_profile overwrites itself in-place across successive DATA steps.",
      mitigation: "Assign separate physical intermediate DD names (e.g. CUSTPRF1, CUSTPRF2) in JCL job stream."
    },
    {
      trapId: "TRAP-016",
      stepId: "STEP-015",
      category: "PROC_GENERATED_VARIABLES",
      line: 130,
      description: "PROC SUMMARY and FREQ generate automatic columns (_TYPE_, _FREQ_, COUNT, PERCENT) in output tables.",
      mitigation: "Explicitly specify record layout in output copybook including count and frequency accumulators."
    },
    {
      trapId: "TRAP-017",
      stepId: "STEP-019",
      category: "SQL_NULL_VS_MISSING",
      line: 193,
      description: "LEFT JOIN in PROC SQL produces SQL NULLs for unmatched rows, which convert to SAS missing (.) or spaces.",
      mitigation: "Use DB2 SQL indicator variables (:VAR :VAR-IND) or COBOL 88-level null sentinels."
    },
    {
      trapId: "TRAP-018",
      stepId: "STEP-034",
      category: "MACRO_DYNAMIC_EXECUTION",
      line: 331,
      description: "Macro %build_region_report dynamically generates alternative DATA step code paths based on &region parameter.",
      mitigation: "Static COBOL programs must handle parameter filtering via run-time linkage-section or PARM evaluation."
    },
    {
      trapId: "TRAP-019",
      stepId: "STEP-001",
      category: "EXTERNAL_DATA_BOUNDARY",
      line: 13,
      description: "LIBNAME RAW points to external unmanaged physical schema; field lengths and types must be pinned via copybooks.",
      mitigation: "Map SAS external datasets to mainframe QSAM files / VSAM datasets defined in JCL DD statements."
    },
    {
      trapId: "TRAP-020",
      stepId: "STEP-012",
      category: "PDV_RESET_ANOMALY",
      line: 101,
      description: "Variable name collision in match-merge: sales_sorted.region silently overwrites customer_sorted.region in the PDV.",
      mitigation: "In COBOL Working-Storage, maintain separate prefixed fields (CUST-REGION vs SALE-REGION) to prevent silent data clobbering."
    },
    {
      trapId: "TRAP-021",
      stepId: "STEP-027",
      category: "FIRST_LAST_GROUPING",
      line: 277,
      description: "Fatal sequence violation: daily_sales runs BY sale_date on WORKLIB.sales_sorted which is sorted by customer_id first.",
      mitigation: "Inject DFSORT step in JCL to re-sort transaction stream by sale_date before daily aggregation."
    },
    {
      trapId: "TRAP-022",
      stepId: "STEP-039",
      category: "MERGE_WITHOUT_BY",
      line: 361,
      description: "Match-merge key mismatch and sequence defect: region_channel_summary contains region (not customer_region) and region_report is sorted by sales desc.",
      mitigation: "Standardize join key naming and inject explicit DFSORT steps in JCL before match-merge."
    },
    {
      trapId: "TRAP-023",
      stepId: "STEP-046",
      category: "MISSING_VALUE_COMPARISON",
      line: 780,
      description: "Missing quantity and unit_price evaluate as < 0 in DATA step validation, misclassifying missing records as negative values.",
      mitigation: "In COBOL, explicitly check for missing/uninitialized state before evaluating negative value validation rules."
    }
  ]
};

fs.writeFileSync(path.join(p1Dir, 'sas-traps-ledger.json'), JSON.stringify(updatedTraps, null, 2));
console.log(`Updated sas-traps-ledger.json with ${updatedTraps.traps.length} verified traps.`);

// 3. Update uncertainty-assumptions-register.json
const updatedUncertainties = {
  items: [
    {
      id: "UNC-001",
      kind: "PARTIAL_SCHEMA_UNKNOWN",
      stepId: "STEP-006",
      description: "External RAW.customers physical layout is unmanaged in SAS code; field types and lengths inferred from SET statement.",
      impact: "MEDIUM",
      status: "INFERRED"
    },
    {
      id: "UNC-002",
      kind: "PARTIAL_SCHEMA_UNKNOWN",
      stepId: "STEP-008",
      description: "External RAW.products physical layout is unmanaged; field types and lengths inferred from SET statement.",
      impact: "MEDIUM",
      status: "INFERRED"
    },
    {
      id: "UNC-003",
      kind: "PARTIAL_SCHEMA_UNKNOWN",
      stepId: "STEP-010",
      description: "External RAW.sales physical layout is unmanaged; field types and formats inferred from LENGTH and FORMAT statements.",
      impact: "MEDIUM",
      status: "INFERRED"
    },
    {
      id: "UNC-004",
      kind: "DYNAMIC_UNRESOLVED",
      stepId: "STEP-037",
      description: "Macro %build_region_report dynamically conditions on &RUN_REGION; in production this parameter may be injected via scheduler.",
      impact: "LOW",
      status: "CONFIRMED"
    },
    {
      id: "UNC-005",
      kind: "DYNAMIC_UNRESOLVED",
      stepId: "STEP-056",
      description: "Macro %parameterized_filter dynamic table substitution (&output) resolved statically to WORKLIB.high_value_sales.",
      impact: "LOW",
      status: "CONFIRMED"
    },
    {
      id: "UNC-006",
      kind: "REQUIRES_REVIEW",
      stepId: "STEP-006",
      description: "Source code defect: FIRST.customer_id evaluated without BY customer_id statement in customer_base. Requires architecture review.",
      impact: "HIGH",
      status: "CONFIRMED"
    },
    {
      id: "UNC-007",
      kind: "REQUIRES_REVIEW",
      stepId: "STEP-027",
      description: "Source sequence defect: daily_sales executes BY sale_date against sales_sorted (sorted by customer_id). Requires JCL sort step.",
      impact: "HIGH",
      status: "CONFIRMED"
    },
    {
      id: "UNC-008",
      kind: "REQUIRES_REVIEW",
      stepId: "STEP-039",
      description: "Source join defect: final_sales_extract merges on customer_region where inputs contain region and are sorted by sales desc.",
      impact: "HIGH",
      status: "CONFIRMED"
    },
    {
      id: "UNC-009",
      kind: "REQUIRES_REVIEW",
      stepId: "STEP-044",
      description: "Source loop defect: reconciliation executes conditional SET on _N_=1 without STOP, causing infinite loop in batch SAS.",
      impact: "HIGH",
      status: "CONFIRMED"
    },
    {
      id: "ASM-001",
      kind: "ASSUMPTION",
      stepId: "STEP-001",
      description: "Source system operates in single-byte character encoding (ASCII/EBCDIC standard).",
      impact: "LOW",
      status: "RESOLVED"
    },
    {
      id: "ASM-002",
      kind: "ASSUMPTION",
      stepId: "STEP-044",
      description: "Reconciliation baseline expected_rows and expected_sales require pre-migration historical baseline inputs.",
      impact: "MEDIUM",
      status: "RESOLVED"
    }
  ]
};

fs.writeFileSync(path.join(p1Dir, 'uncertainty-assumptions-register.json'), JSON.stringify(updatedUncertainties, null, 2));
console.log(`Updated uncertainty-assumptions-register.json with ${updatedUncertainties.items.length} items.`);
