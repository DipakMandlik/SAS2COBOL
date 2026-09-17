/*============================================================================*/
/* SYNTHETIC ENTERPRISE SAS WORKLOAD                                          */
/* Purpose: Phase 1 SAS-to-COBOL modernization intelligence test fixture     */
/* Workload ID: SYN-SAS-001                                                   */
/* IMPORTANT: Synthetic test source - NOT client production code              */
/*============================================================================*/

options mprint mlogic symbolgen validvarname=any;
%let RUN_DATE=%sysfunc(today());
%let RUN_TS=%sysfunc(datetime());
%let SOURCE_SYSTEM=ENTERPRISE_SALES;

libname RAW "/data/raw/sales";
libname REF "/data/reference";
libname WORKLIB "/data/work";
filename ERRLOG "/data/logs/sales_error.log";

%macro set_run_context(region=ALL, min_amount=0);
    %global RUN_REGION MIN_AMOUNT;
    %let RUN_REGION=&region;
    %let MIN_AMOUNT=&min_amount;
%mend;

%macro choose_period(period=MONTHLY);
    %global PERIOD_START PERIOD_END;
    %if %upcase(&period)=MONTHLY %then %do;
        %let PERIOD_START=%sysfunc(intnx(month,%sysfunc(today()),0,b));
        %let PERIOD_END=%sysfunc(intnx(month,%sysfunc(today()),0,e));
    %end;
    %else %if %upcase(&period)=DAILY %then %do;
        %let PERIOD_START=%sysfunc(today());
        %let PERIOD_END=%sysfunc(today());
    %end;
    %else %do;
        %let PERIOD_START=.;
        %let PERIOD_END=.;
    %end;
%mend;

%set_run_context(region=ALL,min_amount=100);
%choose_period(period=MONTHLY);

data WORKLIB.customer_base;
    length customer_id 8 customer_name $80 segment $20 region $20 status $12;
    set RAW.customers;
    if missing(customer_id) then delete;
    if missing(status) then status='UNKNOWN';
    if missing(region) then region='UNASSIGNED';
    if upcase(status) ne 'INACTIVE';
    if first.customer_id then customer_name=strip(customer_name);
    customer_name=compbl(customer_name);
    if missing(segment) then segment='UNCLASSIFIED';
run;

proc sort data=WORKLIB.customer_base
          out=WORKLIB.customer_sorted;
    by customer_id;
run;

data WORKLIB.product_base;
    length product_id 8 product_name $100 category $40 subcategory $40;
    set RAW.products;
    if missing(product_id) then delete;
    if missing(category) then category='UNKNOWN';
    if missing(subcategory) then subcategory='UNKNOWN';
    product_name=propcase(strip(product_name));
run;

proc sort data=WORKLIB.product_base
          out=WORKLIB.product_sorted;
    by product_id;
run;

data WORKLIB.sales_base;
    length sale_id 8 customer_id 8 product_id 8 quantity 8;
    length unit_price 8 discount_pct 8 gross_amount 8 discount_amount 8 net_amount 8;
    length sale_date 8 region $20 channel $20;
    format sale_date date9. gross_amount discount_amount net_amount comma14.2;
    set RAW.sales;
    if missing(sale_id) then delete;
    if missing(customer_id) then customer_id=0;
    if missing(product_id) then product_id=0;
    if missing(quantity) or quantity < 0 then quantity=0;
    if missing(unit_price) then unit_price=0;
    if missing(discount_pct) then discount_pct=0;
    gross_amount=quantity*unit_price;
    discount_amount=gross_amount*(discount_pct/100);
    net_amount=gross_amount-discount_amount;
    if missing(region) then region='UNASSIGNED';
    if missing(channel) then channel='UNKNOWN';
    if sale_date=. then sale_date=&RUN_DATE;
    if net_amount >= &MIN_AMOUNT;
run;

proc sort data=WORKLIB.sales_base
          out=WORKLIB.sales_sorted;
    by customer_id sale_date sale_id;
run;

data WORKLIB.customer_sales;
    merge WORKLIB.customer_sorted(in=in_customer)
          WORKLIB.sales_sorted(in=in_sale);
    by customer_id;
    if in_customer and in_sale;
    customer_status=status;
    customer_segment=segment;
    customer_region=region;
run;

proc sort data=WORKLIB.customer_sales
          out=WORKLIB.customer_sales_sorted;
    by customer_id sale_date;
run;

data WORKLIB.customer_monthly;
    set WORKLIB.customer_sales_sorted;
    by customer_id;
    retain customer_total 0 transaction_count 0;
    if first.customer_id then do;
        customer_total=0;
        transaction_count=0;
    end;
    customer_total + net_amount;
    transaction_count + 1;
    if last.customer_id then output;
    keep customer_id customer_status customer_segment customer_region
         customer_total transaction_count;
run;

proc summary data=WORKLIB.sales_sorted nway;
    class region channel;
    var gross_amount discount_amount net_amount quantity;
    output out=WORKLIB.region_channel_summary
        sum(gross_amount)=gross_sales
        sum(discount_amount)=discount_total
        sum(net_amount)=net_sales
        sum(quantity)=units
        mean(net_amount)=avg_ticket
        max(net_amount)=max_ticket
        min(net_amount)=min_ticket;
run;

proc means data=WORKLIB.sales_sorted nway;
    class region;
    var net_amount quantity;
    output out=WORKLIB.region_summary
        sum(net_amount)=regional_sales
        sum(quantity)=regional_units
        mean(net_amount)=regional_avg
        max(net_amount)=regional_max;
run;

proc freq data=WORKLIB.sales_sorted;
    tables region*channel / missing out=WORKLIB.region_channel_freq;
    tables channel / missing out=WORKLIB.channel_freq;
run;

proc transpose data=WORKLIB.region_summary
               out=WORKLIB.region_summary_wide prefix=metric_;
    id region;
    var regional_sales regional_units regional_avg regional_max;
run;

proc sql;
    create table WORKLIB.enriched_sales as
    select s.sale_id,
           s.sale_date,
           s.customer_id,
           c.customer_name,
           c.segment,
           c.region as customer_region,
           s.product_id,
           p.product_name,
           p.category,
           p.subcategory,
           s.quantity,
           s.unit_price,
           s.discount_pct,
           s.gross_amount,
           s.discount_amount,
           s.net_amount,
           case
             when s.net_amount >= 10000 then 'HIGH'
             when s.net_amount >= 5000 then 'MEDIUM'
             else 'STANDARD'
           end as value_band length=10,
           case
             when s.discount_pct >= 30 then 'PROMO'
             when s.discount_pct > 0 then 'DISCOUNTED'
             else 'FULL_PRICE'
           end as pricing_band length=12
    from WORKLIB.sales_sorted as s
    left join WORKLIB.customer_sorted as c
      on s.customer_id=c.customer_id
    left join WORKLIB.product_sorted as p
      on s.product_id=p.product_id
    where s.net_amount > 0
    order by s.customer_id, s.sale_date, s.sale_id;
quit;

data WORKLIB.sales_rules;
    set WORKLIB.enriched_sales;
    length risk_flag $20 priority $12;
    risk_flag='NORMAL';
    priority='STANDARD';
    if missing(customer_name) then risk_flag='MISSING_CUSTOMER';
    if missing(product_name) then risk_flag='MISSING_PRODUCT';
    if net_amount > 25000 then risk_flag='LARGE_TRANSACTION';
    if discount_pct >= 50 then risk_flag='HIGH_DISCOUNT';
    if quantity >= 100 then priority='BULK';
    if value_band='HIGH' and pricing_band='PROMO' then priority='REVIEW';
    if risk_flag ne 'NORMAL' or priority ne 'STANDARD';
run;

proc sort data=WORKLIB.sales_rules out=WORKLIB.review_queue;
    by descending net_amount customer_id sale_date;
run;

data WORKLIB.review_queue_final;
    set WORKLIB.review_queue;
    retain queue_rank 0;
    queue_rank+1;
    length review_reason $120;
    if risk_flag='MISSING_CUSTOMER' then review_reason='Customer reference unavailable';
    else if risk_flag='MISSING_PRODUCT' then review_reason='Product reference unavailable';
    else if risk_flag='LARGE_TRANSACTION' then review_reason='Large transaction requires review';
    else if risk_flag='HIGH_DISCOUNT' then review_reason='High discount requires review';
    else if priority='REVIEW' then review_reason='High value promotional transaction';
    else review_reason='Bulk or operational review';
run;

proc sql;
    create table WORKLIB.customer_kpis as
    select customer_id,
           max(customer_name) as customer_name,
           max(customer_region) as region,
           max(customer_segment) as segment,
           sum(net_amount) as total_sales,
           count(*) as transaction_count,
           mean(net_amount) as average_transaction,
           max(net_amount) as maximum_transaction
    from WORKLIB.enriched_sales
    group by customer_id
    having calculated total_sales > 0;
quit;

proc sql;
    create table WORKLIB.product_kpis as
    select product_id,
           max(product_name) as product_name,
           max(category) as category,
           max(subcategory) as subcategory,
           sum(quantity) as units_sold,
           sum(net_amount) as net_sales,
           mean(net_amount) as average_sale
    from WORKLIB.enriched_sales
    group by product_id;
quit;

data WORKLIB.customer_tier;
    set WORKLIB.customer_kpis;
    length customer_tier $12;
    if total_sales >= 100000 then customer_tier='PLATINUM';
    else if total_sales >= 50000 then customer_tier='GOLD';
    else if total_sales >= 10000 then customer_tier='SILVER';
    else customer_tier='STANDARD';
    if transaction_count >= 100 then loyalty_flag='Y';
    else loyalty_flag='N';
run;

proc sort data=WORKLIB.customer_tier out=WORKLIB.customer_tier_sorted;
    by descending total_sales customer_id;
run;

data WORKLIB.daily_sales;
    set WORKLIB.sales_sorted;
    by sale_date;
    retain daily_sales 0 daily_units 0;
    if first.sale_date then do;
        daily_sales=0;
        daily_units=0;
    end;
    daily_sales+net_amount;
    daily_units+quantity;
    if last.sale_date then output;
    keep sale_date daily_sales daily_units;
run;

proc sort data=WORKLIB.daily_sales out=WORKLIB.daily_sales_sorted;
    by sale_date;
run;

proc transpose data=WORKLIB.daily_sales_sorted
               out=WORKLIB.daily_sales_pivot prefix=day_;
    id sale_date;
    var daily_sales daily_units;
run;

data WORKLIB.customer_flags;
    merge WORKLIB.customer_tier_sorted(in=a)
          WORKLIB.customer_monthly(in=b);
    by customer_id;
    if a;
    length activity_flag $12;
    if b and transaction_count > 0 then activity_flag='ACTIVE';
    else activity_flag='INACTIVE';
    if total_sales=. then total_sales=0;
    if customer_total=. then customer_total=0;
run;

proc sort data=WORKLIB.customer_flags
          out=WORKLIB.customer_flags_sorted;
    by region customer_tier descending total_sales;
run;

proc summary data=WORKLIB.customer_flags_sorted nway;
    class region customer_tier;
    var total_sales transaction_count customer_total;
    output out=WORKLIB.tier_summary
        sum(total_sales)=tier_sales
        sum(transaction_count)=tier_transactions
        mean(total_sales)=avg_customer_sales
        max(total_sales)=top_customer_sales;
run;

proc freq data=WORKLIB.customer_flags_sorted;
    tables customer_tier*activity_flag / missing out=WORKLIB.tier_activity_freq;
    tables region*customer_tier / missing out=WORKLIB.region_tier_freq;
run;

%macro build_region_report(region=ALL);
    %if %upcase(&region)=ALL %then %do;
        data WORKLIB.region_report_input;
            set WORKLIB.enriched_sales;
        run;
    %end;
    %else %do;
        data WORKLIB.region_report_input;
            set WORKLIB.enriched_sales;
            where upcase(customer_region)=upcase("&region");
        run;
    %end;
%mend;

%build_region_report(region=&RUN_REGION);

proc sql;
    create table WORKLIB.region_report as
    select customer_region,
           count(*) as transactions,
           sum(net_amount) as sales,
           mean(net_amount) as average_sale,
           sum(quantity) as units
    from WORKLIB.region_report_input
    group by customer_region
    order by sales desc;
quit;

data WORKLIB.final_sales_extract;
    merge WORKLIB.region_report(in=r)
          WORKLIB.region_channel_summary(in=s);
    by customer_region;
    if r;
    if missing(transactions) then transactions=0;
    if missing(sales) then sales=0;
    length report_status $15;
    if sales >= 1000000 then report_status='TARGET_MET';
    else if sales >= 500000 then report_status='ON_TRACK';
    else report_status='BELOW_TARGET';
run;

proc sort data=WORKLIB.final_sales_extract;
    by descending sales;
run;

proc datasets library=WORKLIB nolist;
    contents data=_all_ out=WORKLIB.metadata_snapshot;
quit;

data WORKLIB.audit_extract;
    set WORKLIB.final_sales_extract;
    length audit_timestamp 8 audit_source $30;
    audit_timestamp=&RUN_TS;
    audit_source="&SOURCE_SYSTEM";
    if sales < 0 then do;
        put "ERROR: NEGATIVE SALES " customer_region= sales=;
        output;
    end;
    else output;
run;

proc sql;
    create table WORKLIB.final_control_totals as
    select count(*) as row_count,
           sum(sales) as total_sales,
           sum(transactions) as total_transactions
    from WORKLIB.audit_extract;
quit;

data WORKLIB.reconciliation;
    if _n_=1 then do;
        set WORKLIB.final_control_totals;
        expected_rows=.;
        expected_sales=.;
    end;
    length reconciliation_status $20;
    if missing(expected_rows) then reconciliation_status='BASELINE_REQUIRED';
    else if row_count=expected_rows and abs(total_sales-expected_sales) < 0.01
         then reconciliation_status='MATCH';
    else reconciliation_status='MISMATCH';
run;

/* Additional processing blocks intentionally included to exercise
   dependency, lineage, state, PROC, macro, and traceability analysis. */

data WORKLIB.segment_rollup;
    set WORKLIB.customer_flags_sorted;
    by region customer_tier;
    retain segment_sales segment_customers 0;
    if first.customer_tier then do;
        segment_sales=0;
        segment_customers=0;
    end;
    segment_sales+total_sales;
    segment_customers+1;
    if last.customer_tier then output;
    keep region customer_tier segment_sales segment_customers;
run;

proc sort data=WORKLIB.segment_rollup out=WORKLIB.segment_rollup_sorted;
    by region descending segment_sales;
run;

proc sql;
    create table WORKLIB.segment_ranked as
    select *,
           monotonic() as generated_rank
    from WORKLIB.segment_rollup_sorted
    order by region, calculated generated_rank;
quit;

data WORKLIB.exception_extract;
    set WORKLIB.review_queue_final;
    where risk_flag ne 'NORMAL' or priority ne 'STANDARD';
    length exception_code $20;
    if risk_flag='MISSING_CUSTOMER' then exception_code='CUST_REF';
    else if risk_flag='MISSING_PRODUCT' then exception_code='PROD_REF';
    else if risk_flag='LARGE_TRANSACTION' then exception_code='LARGE_TXN';
    else if risk_flag='HIGH_DISCOUNT' then exception_code='HIGH_DISC';
    else exception_code='OPER_REVIEW';
run;

proc freq data=WORKLIB.exception_extract;
    tables exception_code / missing out=WORKLIB.exception_counts;
run;

data WORKLIB.exception_summary;
    set WORKLIB.exception_counts;
    length severity $10;
    if percent >= 20 then severity='HIGH';
    else if percent >= 5 then severity='MEDIUM';
    else severity='LOW';
run;

proc sql;
    create table WORKLIB.management_summary as
    select a.region,
           a.customer_tier,
           a.tier_sales,
           a.tier_transactions,
           b.severity,
           b.count as exception_count
    from WORKLIB.tier_summary as a
    left join WORKLIB.exception_summary as b
      on 1=1
    order by a.region, a.tier_sales desc;
quit;

data WORKLIB.delivery_manifest;
    length artifact_name $80 artifact_type $30 delivery_status $20;
    set WORKLIB.management_summary;
    artifact_name=cats('SALES_',region,'_',customer_tier);
    artifact_type='MANAGEMENT_SUMMARY';
    if missing(severity) then delivery_status='READY';
    else delivery_status='REVIEW';
run;

proc sort data=WORKLIB.delivery_manifest;
    by delivery_status region descending tier_sales;
run;

%macro parameterized_filter(input=WORKLIB.enriched_sales,
                            output=WORKLIB.filtered_sales,
                            threshold=1000);
    data &output;
        set &input;
        if net_amount >= &threshold;
    run;
%mend;

%parameterized_filter(
    input=WORKLIB.enriched_sales,
    output=WORKLIB.high_value_sales,
    threshold=10000
);

proc sql;
    create table WORKLIB.high_value_customer as
    select customer_id,
           count(*) as high_value_transactions,
           sum(net_amount) as high_value_sales
    from WORKLIB.high_value_sales
    group by customer_id
    order by calculated high_value_sales desc;
quit;

data WORKLIB.final_customer_profile;
    merge WORKLIB.customer_flags_sorted(in=base)
          WORKLIB.high_value_customer(in=hv);
    by customer_id;
    if base;
    if missing(high_value_transactions) then high_value_transactions=0;
    if missing(high_value_sales) then high_value_sales=0;
    length engagement_level $15;
    if high_value_sales >= 50000 then engagement_level='HIGH';
    else if high_value_sales >= 10000 then engagement_level='MEDIUM';
    else engagement_level='STANDARD';
run;

proc sort data=WORKLIB.final_customer_profile;
    by descending high_value_sales customer_id;
run;

data WORKLIB.final_customer_profile;
    set WORKLIB.final_customer_profile;
    retain profile_sequence 0;
    profile_sequence+1;
    if missing(profile_sequence) then profile_sequence=1;
run;

proc summary data=WORKLIB.final_customer_profile nway;
    class engagement_level;
    var high_value_sales total_sales;
    output out=WORKLIB.engagement_summary
        sum(high_value_sales)=engagement_sales
        sum(total_sales)=total_customer_sales
        mean(high_value_sales)=avg_engagement_sales;
run;

proc sql;
    create table WORKLIB.final_control_report as
    select engagement_level,
           engagement_sales,
           total_customer_sales,
           avg_engagement_sales,
           case
             when engagement_sales >= 500000 then 'GREEN'
             when engagement_sales >= 100000 then 'AMBER'
             else 'RED'
           end as control_status length=10
    from WORKLIB.engagement_summary
    order by engagement_sales desc;
quit;

/* End-of-workload marker */
%put NOTE: SYNTHETIC ENTERPRISE SAS WORKLOAD COMPLETE;

/*----------------------------------------------------------------------------*/
/* Extended customer scoring and operational controls                         */
/*----------------------------------------------------------------------------*/

data WORKLIB.customer_scoring;
    set WORKLIB.final_customer_profile;
    length score_band $12 engagement_code $8;
    retain score 0;
    score=0;
    if total_sales >= 100000 then score+40;
    else if total_sales >= 50000 then score+30;
    else if total_sales >= 10000 then score+20;
    else score+10;
    if transaction_count >= 100 then score+30;
    else if transaction_count >= 50 then score+20;
    else if transaction_count >= 10 then score+10;
    if high_value_sales >= 50000 then score+30;
    else if high_value_sales >= 10000 then score+20;
    else if high_value_sales > 0 then score+10;
    if score >= 80 then score_band='PLATINUM';
    else if score >= 60 then score_band='GOLD';
    else if score >= 40 then score_band='SILVER';
    else score_band='BRONZE';
    if engagement_level='HIGH' then engagement_code='H';
    else if engagement_level='MEDIUM' then engagement_code='M';
    else engagement_code='S';
run;

proc sort data=WORKLIB.customer_scoring;
    by score_band descending score customer_id;
run;

proc freq data=WORKLIB.customer_scoring;
    tables score_band*engagement_level / missing out=WORKLIB.score_distribution;
run;

proc summary data=WORKLIB.customer_scoring nway;
    class score_band;
    var total_sales transaction_count high_value_sales score;
    output out=WORKLIB.score_summary
        sum(total_sales)=sales
        sum(transaction_count)=transactions
        sum(high_value_sales)=high_value_sales
        mean(score)=average_score
        max(score)=maximum_score
        min(score)=minimum_score;
run;

data WORKLIB.score_summary;
    set WORKLIB.score_summary;
    length score_status $12;
    if maximum_score >= 80 then score_status='STRONG';
    else if maximum_score >= 60 then score_status='STABLE';
    else score_status='DEVELOP';
run;

proc sql;
    create table WORKLIB.region_customer_score as
    select region,
           score_band,
           count(*) as customer_count,
           sum(total_sales) as region_sales,
           mean(score) as avg_score,
           max(score) as max_score
    from WORKLIB.customer_scoring
    group by region, score_band
    order by region, calculated region_sales desc;
quit;

data WORKLIB.region_customer_score_flags;
    set WORKLIB.region_customer_score;
    length action_flag $20;
    if max_score >= 80 and region_sales >= 250000 then action_flag='PRIORITY';
    else if max_score >= 60 then action_flag='STANDARD';
    else action_flag='DEVELOPMENT';
run;

proc sort data=WORKLIB.region_customer_score_flags;
    by region action_flag descending region_sales;
run;

/*----------------------------------------------------------------------------*/
/* Product performance and inventory indicators                                */
/*----------------------------------------------------------------------------*/

proc sql;
    create table WORKLIB.product_performance as
    select p.product_id,
           p.product_name,
           p.category,
           p.subcategory,
           sum(e.quantity) as units,
           sum(e.net_amount) as sales,
           mean(e.net_amount) as average_sale,
           count(e.sale_id) as transactions,
           max(e.sale_date) as last_sale_date format=date9.
    from WORKLIB.product_sorted as p
    left join WORKLIB.enriched_sales as e
      on p.product_id=e.product_id
    group by p.product_id, p.product_name, p.category, p.subcategory;
quit;

data WORKLIB.product_performance;
    set WORKLIB.product_performance;
    length demand_band $12 inventory_flag $15;
    if units >= 1000 then demand_band='VERY_HIGH';
    else if units >= 500 then demand_band='HIGH';
    else if units >= 100 then demand_band='MEDIUM';
    else demand_band='LOW';
    if missing(transactions) or transactions=0 then inventory_flag='NO_ACTIVITY';
    else if units < 10 then inventory_flag='LOW_MOVEMENT';
    else inventory_flag='ACTIVE';
run;

proc sort data=WORKLIB.product_performance;
    by category descending sales product_id;
run;

proc summary data=WORKLIB.product_performance nway;
    class category demand_band;
    var sales units transactions;
    output out=WORKLIB.category_demand_summary
        sum(sales)=category_sales
        sum(units)=category_units
        sum(transactions)=category_transactions;
run;

proc freq data=WORKLIB.product_performance;
    tables category*demand_band / missing out=WORKLIB.category_demand_freq;
run;

/*----------------------------------------------------------------------------*/
/* Date-window analysis                                                        */
/*----------------------------------------------------------------------------*/

data WORKLIB.sales_period_flags;
    set WORKLIB.enriched_sales;
    length period_type $12 weekend_flag $1;
    month_start=intnx('month',sale_date,0,'b');
    quarter_start=intnx('quarter',sale_date,0,'b');
    year_start=intnx('year',sale_date,0,'b');
    format month_start quarter_start year_start date9.;
    if weekday(sale_date) in (1,7) then weekend_flag='Y';
    else weekend_flag='N';
    if day(sale_date) <= 7 then period_type='OPENING';
    else if day(sale_date) >= 24 then period_type='CLOSING';
    else period_type='MID';
run;

proc sort data=WORKLIB.sales_period_flags;
    by month_start region customer_id sale_date;
run;

proc summary data=WORKLIB.sales_period_flags nway;
    class month_start region;
    var net_amount quantity;
    output out=WORKLIB.month_region_summary
        sum(net_amount)=monthly_sales
        sum(quantity)=monthly_units
        mean(net_amount)=monthly_average;
run;

proc summary data=WORKLIB.sales_period_flags nway;
    class quarter_start region;
    var net_amount quantity;
    output out=WORKLIB.quarter_region_summary
        sum(net_amount)=quarter_sales
        sum(quantity)=quarter_units
        mean(net_amount)=quarter_average;
run;

proc sql;
    create table WORKLIB.month_region_ranked as
    select *,
           case
             when monthly_sales >= 1000000 then 'A'
             when monthly_sales >= 500000 then 'B'
             when monthly_sales >= 100000 then 'C'
             else 'D'
           end as performance_band length=1
    from WORKLIB.month_region_summary
    order by month_start, monthly_sales desc;
quit;

/*----------------------------------------------------------------------------*/
/* Duplicate and data-quality diagnostics                                     */
/*----------------------------------------------------------------------------*/

proc sort data=RAW.sales
          out=WORKLIB.sales_duplicate_check
          nodupkey
          dupout=WORKLIB.sales_duplicates;
    by sale_id;
run;

data WORKLIB.sales_quality;
    set RAW.sales;
    length quality_status $20 quality_reason $80;
    quality_status='VALID';
    quality_reason='No exception detected';
    if missing(sale_id) then do;
        quality_status='INVALID';
        quality_reason='Missing sale identifier';
    end;
    else if missing(customer_id) then do;
        quality_status='WARNING';
        quality_reason='Missing customer identifier';
    end;
    else if missing(product_id) then do;
        quality_status='WARNING';
        quality_reason='Missing product identifier';
    end;
    else if quantity < 0 then do;
        quality_status='INVALID';
        quality_reason='Negative quantity';
    end;
    else if unit_price < 0 then do;
        quality_status='INVALID';
        quality_reason='Negative unit price';
    end;
    else if discount_pct > 100 then do;
        quality_status='INVALID';
        quality_reason='Discount exceeds maximum';
    end;
run;

proc freq data=WORKLIB.sales_quality;
    tables quality_status / missing out=WORKLIB.sales_quality_counts;
run;

proc sql;
    create table WORKLIB.quality_control as
    select quality_status,
           count(*) as records,
           calculated records / (select count(*) from WORKLIB.sales_quality) * 100
              as record_pct
    from WORKLIB.sales_quality
    group by quality_status
    order by records desc;
quit;

/*----------------------------------------------------------------------------*/
/* Customer activity windows                                                   */
/*----------------------------------------------------------------------------*/

proc sql;
    create table WORKLIB.customer_activity as
    select customer_id,
           min(sale_date) as first_sale format=date9.,
           max(sale_date) as last_sale format=date9.,
           intck('day',calculated first_sale,calculated last_sale) as active_days,
           count(*) as transaction_count,
           sum(net_amount) as sales
    from WORKLIB.enriched_sales
    group by customer_id;
quit;

data WORKLIB.customer_activity;
    set WORKLIB.customer_activity;
    length activity_band $15 recency_band $15;
    if transaction_count >= 100 then activity_band='VERY_ACTIVE';
    else if transaction_count >= 50 then activity_band='ACTIVE';
    else if transaction_count >= 10 then activity_band='OCCASIONAL';
    else activity_band='LOW';
    if last_sale >= intnx('day',today(),-30) then recency_band='RECENT';
    else if last_sale >= intnx('day',today(),-90) then recency_band='STALE';
    else recency_band='DORMANT';
run;

proc sort data=WORKLIB.customer_activity;
    by recency_band descending sales;
run;

proc freq data=WORKLIB.customer_activity;
    tables activity_band*recency_band / missing out=WORKLIB.activity_matrix;
run;

proc summary data=WORKLIB.customer_activity nway;
    class activity_band recency_band;
    var sales transaction_count active_days;
    output out=WORKLIB.activity_summary
        sum(sales)=sales
        sum(transaction_count)=transactions
        mean(active_days)=average_active_days;
run;

/*----------------------------------------------------------------------------*/
/* Regional control and exception processing                                   */
/*----------------------------------------------------------------------------*/

data WORKLIB.region_controls;
    set WORKLIB.region_report;
    length control_flag $12 control_reason $100;
    control_flag='PASS';
    control_reason='Within operating thresholds';
    if sales < 0 then do;
        control_flag='FAIL';
        control_reason='Negative regional sales';
    end;
    else if transactions=0 then do;
        control_flag='WARN';
        control_reason='No transactions reported';
    end;
    else if sales/transactions < 10 then do;
        control_flag='WARN';
        control_reason='Average transaction below threshold';
    end;
run;

proc freq data=WORKLIB.region_controls;
    tables control_flag / missing out=WORKLIB.region_control_counts;
run;

proc sql;
    create table WORKLIB.region_control_detail as
    select r.region,
           r.sales,
           r.transactions,
           r.average_sale,
           c.control_flag,
           c.control_reason
    from WORKLIB.region_report as r
    left join WORKLIB.region_controls as c
      on r.customer_region=c.customer_region;
quit;

/*----------------------------------------------------------------------------*/
/* Repeated stateful transformations for semantic stress testing              */
/*----------------------------------------------------------------------------*/

data WORKLIB.region_running_sales;
    set WORKLIB.sales_period_flags;
    by region sale_date;
    retain running_sales 0 running_units 0;
    if first.region then do;
        running_sales=0;
        running_units=0;
    end;
    running_sales+net_amount;
    running_units+quantity;
    if last.sale_date then output;
    keep region sale_date running_sales running_units;
run;

proc sort data=WORKLIB.region_running_sales;
    by region sale_date;
run;

data WORKLIB.region_running_sales;
    set WORKLIB.region_running_sales;
    by region;
    retain previous_sales 0;
    sales_change=running_sales-previous_sales;
    previous_sales=running_sales;
    if first.region then sales_change=running_sales;
run;

proc summary data=WORKLIB.region_running_sales nway;
    class region;
    var sales_change;
    output out=WORKLIB.region_change_summary
        sum(sales_change)=net_change
        max(sales_change)=maximum_change
        min(sales_change)=minimum_change;
run;

/*----------------------------------------------------------------------------*/
/* Lookup-style processing                                                     */
/*----------------------------------------------------------------------------*/

proc sql;
    create table WORKLIB.customer_lookup as
    select customer_id,
           max(customer_name) as customer_name,
           max(region) as region,
           max(segment) as segment
    from WORKLIB.customer_sorted
    group by customer_id;
quit;

data WORKLIB.sales_lookup_enriched;
    if _n_=1 then do;
        declare hash h(dataset:'WORKLIB.customer_lookup');
        h.defineKey('customer_id');
        h.defineData('customer_name','region','segment');
        h.defineDone();
    end;
    set WORKLIB.sales_sorted;
    length lookup_status $12;
    rc=h.find();
    if rc=0 then lookup_status='MATCH';
    else do;
        lookup_status='MISS';
        customer_name='UNKNOWN';
        region='UNKNOWN';
        segment='UNKNOWN';
    end;
run;

proc freq data=WORKLIB.sales_lookup_enriched;
    tables lookup_status / missing out=WORKLIB.lookup_status_counts;
run;

/*----------------------------------------------------------------------------*/
/* Special missing and conversion-sensitive test expressions                  */
/*----------------------------------------------------------------------------*/

data WORKLIB.semantic_edge_cases;
    set WORKLIB.sales_quality;
    length missing_class $15 conversion_flag $15;
    if discount_pct=. then missing_class='STANDARD_MISSING';
    else if discount_pct=.A then missing_class='SPECIAL_A';
    else if discount_pct=.Z then missing_class='SPECIAL_Z';
    else missing_class='POPULATED';
    conversion_flag='NUMERIC';
    character_amount=put(net_amount,comma14.2);
    numeric_from_text=input(strip(character_amount),comma14.2);
    if numeric_from_text ne net_amount then conversion_flag='CONVERSION_DIFF';
run;

proc freq data=WORKLIB.semantic_edge_cases;
    tables missing_class*conversion_flag / missing out=WORKLIB.semantic_edge_counts;
run;

/*----------------------------------------------------------------------------*/
/* Final operational aggregates                                                */
/*----------------------------------------------------------------------------*/

proc sql;
    create table WORKLIB.operational_dashboard as
    select
        (select count(*) from WORKLIB.enriched_sales) as sales_rows,
        (select sum(net_amount) from WORKLIB.enriched_sales) as total_sales,
        (select count(distinct customer_id) from WORKLIB.enriched_sales) as customers,
        (select count(distinct product_id) from WORKLIB.enriched_sales) as products,
        (select count(*) from WORKLIB.review_queue_final) as review_items,
        (select count(*) from WORKLIB.sales_duplicates) as duplicate_sales,
        (select count(*) from WORKLIB.sales_quality where quality_status='INVALID') as invalid_sales;
quit;

data WORKLIB.operational_dashboard;
    set WORKLIB.operational_dashboard;
    length overall_status $15;
    if invalid_sales > 0 or duplicate_sales > 0 then overall_status='REVIEW';
    else if review_items > 0 then overall_status='MONITOR';
    else overall_status='READY';
    report_date=today();
    format report_date date9.;
run;

proc print data=WORKLIB.operational_dashboard;
run;

/*----------------------------------------------------------------------------*/
/* End synthetic workload                                                      */
/*----------------------------------------------------------------------------*/
