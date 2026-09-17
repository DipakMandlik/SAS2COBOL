000100 * COPYBOOK: CPSALE74 - FOR WORKLIB.SALES_RULES                   
000200 01  SALES-RULES-RECORD.                                          
000300     05  SALES-SALE-ID                  PIC S9(9) COMP-3.         
000400     05  SALES-CUSTOMER-ID              PIC S9(9) COMP-3.         
000500     05  SALES-PRODUCT-ID               PIC S9(9) COMP-3.         
000600     05  SALES-NET-AMOUNT               PIC S9(9)V99 COMP-3.      
000700     05  SALES-HIGH-VALUE-FLAG          PIC X(1).                 
000800     05  SALES-ANOMALY-FLAG             PIC X(1).                 
000900     05  SALES-REVIEW-REASON            PIC X(50).                
