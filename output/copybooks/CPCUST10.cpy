000100 * COPYBOOK: CPCUST10 - FOR WORKLIB.CUSTOMER_ACTIVITY             
000200 01  CUSTOMER-ACTIVITY-RECORD.                                    
000300     05  CUSTOM-CUSTOMER-ID             PIC S9(9) COMP-3.         
000400     05  CUSTOM-FIRST-SALE              PIC S9(9)V99 COMP-3.      
000500     05  CUSTOM-LAST-SALE               PIC S9(9)V99 COMP-3.      
000600     05  CUSTOM-ACTIVE-DAYS             PIC 9(8).                 
000700     05  CUSTOM-TRANSACTION-COUNT       PIC S9(9)V99 COMP-3.      
000800     05  CUSTOM-SALES                   PIC S9(9)V99 COMP-3.      
000900     05  CUSTOM-ACTIVITY-BAND           PIC X(15).                
001000     05  CUSTOM-RECENCY-BAND            PIC X(15).                
