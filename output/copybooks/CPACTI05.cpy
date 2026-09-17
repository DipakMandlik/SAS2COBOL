000100 * COPYBOOK: CPACTI05 - FOR WORKLIB.ACTIVITY_SUMMARY              
000200 01  ACTIVITY-SUMMARY-RECORD.                                     
000300     05  ACTIVI-ACTIVITY-BAND           PIC X(15).                
000400     05  ACTIVI-RECENCY-BAND            PIC X(15).                
000500     05  ACTIVI-REC-TYPE                PIC 9(4) COMP-3.          
000600     05  ACTIVI-REC-FREQ                PIC 9(9) COMP-3.          
000700     05  ACTIVI-SALES                   PIC S9(9)V99 COMP-3.      
000800     05  ACTIVI-TRANSACTIONS            PIC S9(9)V99 COMP-3.      
000900     05  ACTIVI-AVERAGE-ACTIVE-DAYS     PIC 9(8).                 
