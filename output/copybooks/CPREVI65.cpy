000100 * COPYBOOK: CPREVI65 - FOR WORKLIB.REVIEW_QUEUE                  
000200 01  REVIEW-QUEUE-RECORD.                                         
000300     05  REVIEW-SALE-ID                 PIC S9(9) COMP-3.         
000400     05  REVIEW-CUSTOMER-ID             PIC S9(9) COMP-3.         
000500     05  REVIEW-PRODUCT-ID              PIC S9(9) COMP-3.         
000600     05  REVIEW-NET-AMOUNT              PIC S9(9)V99 COMP-3.      
000700     05  REVIEW-HIGH-VALUE-FLAG         PIC X(1).                 
000800     05  REVIEW-ANOMALY-FLAG            PIC X(1).                 
000900     05  REVIEW-REVIEW-REASON           PIC X(50).                
