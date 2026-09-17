000100 * COPYBOOK: CPREVI66 - FOR WORKLIB.REVIEW_QUEUE_FINAL            
000200 01  REVIEW-QUEUE-FINAL-RECORD.                                   
000300     05  REVIEW-SALE-ID                 PIC S9(9) COMP-3.         
000400     05  REVIEW-CUSTOMER-ID             PIC S9(9) COMP-3.         
000500     05  REVIEW-PRODUCT-ID              PIC S9(9) COMP-3.         
000600     05  REVIEW-NET-AMOUNT              PIC S9(9)V99 COMP-3.      
000700     05  REVIEW-HIGH-VALUE-FLAG         PIC X(1).                 
000800     05  REVIEW-ANOMALY-FLAG            PIC X(1).                 
000900     05  REVIEW-REVIEW-REASON           PIC X(50).                
001000     05  REVIEW-PRIORITY-LEVEL          PIC X(10).                
001100     05  REVIEW-AUDIT-TIMESTAMP         PIC S9(9)V99 COMP-3.      
