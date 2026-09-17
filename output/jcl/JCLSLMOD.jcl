//JCLSLMOD JOB (MIGRATION),'SAS TO COBOL',CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//*==================================================================
//* TARGET EXECUTABLE BATCH STREAM FOR SAS-TO-COBOL MIGRATION        
//* EXECUTES ALL 34 BATCH STEPS IN PRECISE DECOMPOSITION SEQUENCE   
//*==================================================================
//*------------------------------------------------------------------
//* STEP 01: STEP010_INGEST
//*------------------------------------------------------------------
//STEP010_INGEST EXEC PGM=CBLSL001,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=RAW.CUSTOMERS,DISP=SHR
//OUTFILE  DD DSN=&&CUSTOMER_BASE,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 02: STEP020_SRTCUST
//*------------------------------------------------------------------
//STEP020_SRTCUST EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&CUSTOMER_BASE,DISP=SHR
//SORTOUT  DD DSN=&&CUSTOMER_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 03: STEP030_SRTPROD
//*------------------------------------------------------------------
//STEP030_SRTPROD EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&PRODUCT_BASE,DISP=SHR
//SORTOUT  DD DSN=&&PRODUCT_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 04: STEP040_SRTSALE
//*------------------------------------------------------------------
//STEP040_SRTSALE EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&SALES_BASE,DISP=SHR
//SORTOUT  DD DSN=&&SALES_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 05: STEP050_MRGCUST
//*------------------------------------------------------------------
//STEP050_MRGCUST EXEC PGM=CBLSL002,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&CUSTOMER_SORTED,DISP=SHR
//OUTFILE  DD DSN=&&CUSTOMER_SALES,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 06: STEP060_SRTCSAL
//*------------------------------------------------------------------
//STEP060_SRTCSAL EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&CUSTOMER_SALES,DISP=SHR
//SORTOUT  DD DSN=&&CUSTOMER_SALES_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 07: STEP070_CUSTMNTH
//*------------------------------------------------------------------
//STEP070_CUSTMNTH EXEC PGM=CBLSL002,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&CUSTOMER_SALES_SORTED,DISP=SHR
//OUTFILE  DD DSN=&&CUSTOMER_MONTHLY,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 08: STEP080_AGGREG1
//*------------------------------------------------------------------
//STEP080_AGGREG1 EXEC PGM=CBLSL003,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&SALES_SORTED,DISP=SHR
//OUTFILE  DD DSN=&&REGION_SUMMARY,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 09: STEP090_ENRICH
//*------------------------------------------------------------------
//STEP090_ENRICH EXEC PGM=CBLSL004,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&SALES_SORTED,DISP=SHR
//OUTFILE  DD DSN=&&ENRICHED_SALES,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 10: STEP100_SRTRULE
//*------------------------------------------------------------------
//STEP100_SRTRULE EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&SALES_RULES,DISP=SHR
//SORTOUT  DD DSN=&&SALES_RULES_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 11: STEP110_REVQ
//*------------------------------------------------------------------
//STEP110_REVQ EXEC PGM=CBLSL004,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&SALES_RULES_SORTED,DISP=SHR
//OUTFILE  DD DSN=PROD.SALES.REVIEW.QUEUE,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 12: STEP120_DAILYTR
//*------------------------------------------------------------------
//STEP120_DAILYTR EXEC PGM=CBLSL005,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&CUSTOMER_MONTHLY,DISP=SHR
//OUTFILE  DD DSN=&&CUSTOMER_TIER,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 13: STEP130_SRTDLY
//*------------------------------------------------------------------
//STEP130_SRTDLY EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&DAILY_SALES,DISP=SHR
//SORTOUT  DD DSN=&&DAILY_SALES_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 14: STEP140_PIVDLY
//*------------------------------------------------------------------
//STEP140_PIVDLY EXEC PGM=CBLSL005,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&DAILY_SALES_SORTED,DISP=SHR
//OUTFILE  DD DSN=&&DAILY_SALES_WIDE,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 15: STEP150_REGRPT
//*------------------------------------------------------------------
//STEP150_REGRPT EXEC PGM=CBLSL006,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&SALES_SORTED,DISP=SHR
//OUTFILE  DD DSN=&&REGION_REPORT,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 16: STEP160_SRTRPT
//*------------------------------------------------------------------
//STEP160_SRTRPT EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&FINAL_SALES_EXTRACT,DISP=SHR
//SORTOUT  DD DSN=&&FINAL_SALES_EXTRACT_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 17: STEP170_CLEANUP
//*------------------------------------------------------------------
//STEP170_CLEANUP EXEC PGM=IEFBR14,COND=(0,NE)
//SYSPRINT DD SYSOUT=*
//SYSIN    DD DUMMY
//*------------------------------------------------------------------
//* STEP 18: STEP180_RECON1
//*------------------------------------------------------------------
//STEP180_RECON1 EXEC PGM=CBLSL006,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&FINAL_SALES_EXTRACT_SORTED,DISP=SHR
//OUTFILE  DD DSN=PROD.SALES.AUDIT.EXTRACT,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 19: STEP190_SEGMENT
//*------------------------------------------------------------------
//STEP190_SEGMENT EXEC PGM=CBLSL007,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&ENRICHED_SALES,DISP=SHR
//OUTFILE  DD DSN=&&SEGMENT_ROLLUP,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 20: STEP200_SRTSEG
//*------------------------------------------------------------------
//STEP200_SRTSEG EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&SEGMENT_ROLLUP,DISP=SHR
//SORTOUT  DD DSN=&&SEGMENT_ROLLUP_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 21: STEP210_SEGRANK
//*------------------------------------------------------------------
//STEP210_SEGRANK EXEC PGM=CBLSL007,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&SEGMENT_ROLLUP_SORTED,DISP=SHR
//OUTFILE  DD DSN=&&SEGMENT_RANKED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 22: STEP220_SCORING
//*------------------------------------------------------------------
//STEP220_SCORING EXEC PGM=CBLSL008,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&ENRICHED_SALES,DISP=SHR
//OUTFILE  DD DSN=&&HIGH_VALUE_SALES,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 23: STEP230_SRTSCR
//*------------------------------------------------------------------
//STEP230_SRTSCR EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&CUSTOMER_SCORING,DISP=SHR
//SORTOUT  DD DSN=&&CUSTOMER_SCORING_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 24: STEP240_SCOREBNCH
//*------------------------------------------------------------------
//STEP240_SCOREBNCH EXEC PGM=CBLSL008,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&CUSTOMER_SCORING_SORTED,DISP=SHR
//OUTFILE  DD DSN=&&SCORE_SUMMARY,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 25: STEP250_PRODUCT
//*------------------------------------------------------------------
//STEP250_PRODUCT EXEC PGM=CBLSL009,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&ENRICHED_SALES,DISP=SHR
//OUTFILE  DD DSN=&&PRODUCT_PERFORMANCE,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 26: STEP260_SRTPRD
//*------------------------------------------------------------------
//STEP260_SRTPRD EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&PRODUCT_PERFORMANCE,DISP=SHR
//SORTOUT  DD DSN=&&PRODUCT_PERFORMANCE_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 27: STEP270_PRDSUM
//*------------------------------------------------------------------
//STEP270_PRDSUM EXEC PGM=CBLSL009,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&PRODUCT_PERFORMANCE_SORTED,DISP=SHR
//OUTFILE  DD DSN=&&CATEGORY_REVENUE_TOTALS,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 28: STEP280_DEDUP
//*------------------------------------------------------------------
//STEP280_DEDUP EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=RAW.SALES,DISP=SHR
//SORTOUT  DD DSN=&&SALES_DUPLICATE_CHECK,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 29: STEP290_QUALITY
//*------------------------------------------------------------------
//STEP290_QUALITY EXEC PGM=CBLSL010,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&SALES_DUPLICATE_CHECK,DISP=SHR
//OUTFILE  DD DSN=PROD.SALES.QUALITY.RECORDS,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 30: STEP300_ACTIVTY
//*------------------------------------------------------------------
//STEP300_ACTIVTY EXEC PGM=CBLSL011,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&ENRICHED_SALES,DISP=SHR
//OUTFILE  DD DSN=&&CUSTOMER_ACTIVITY,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 31: STEP310_SRTACT
//*------------------------------------------------------------------
//STEP310_SRTACT EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&CUSTOMER_ACTIVITY,DISP=SHR
//SORTOUT  DD DSN=&&CUSTOMER_ACTIVITY_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 32: STEP320_SRTRUN
//*------------------------------------------------------------------
//STEP320_SRTRUN EXEC PGM=SORT,COND=(0,NE)
//SORTIN   DD DSN=&&REGION_RUNNING_SALES,DISP=SHR
//SORTOUT  DD DSN=&&REGION_RUNNING_SALES_SORTED,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*------------------------------------------------------------------
//* STEP 33: STEP330_RUNSUM
//*------------------------------------------------------------------
//STEP330_RUNSUM EXEC PGM=CBLSL011,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&CUSTOMER_ACTIVITY_SORTED,DISP=SHR
//OUTFILE  DD DSN=&&REGION_RUNNING_SALES_DELTA,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
//*------------------------------------------------------------------
//* STEP 34: STEP340_DASHBRD
//*------------------------------------------------------------------
//STEP340_DASHBRD EXEC PGM=CBLSL012,COND=(0,NE)
//STEPLIB  DD DSN=SYS2.PROD.LOADLIB,DISP=SHR
//INFILE   DD DSN=&&ENRICHED_SALES,DISP=SHR
//OUTFILE  DD DSN=PROD.SALES.OPERATIONAL.DASHBOARD,DISP=(NEW,PASS,DELETE),
//            SPACE=(CYL,(10,5),RLSE),DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSDBOUT DD SYSOUT=*
