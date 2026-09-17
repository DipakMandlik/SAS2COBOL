000100 * COPYBOOK: CPREGI53 - FOR WORKLIB.REGION_CHANNEL_SUMMARY        
000200 01  REGION-CHANNEL-SUMMARY-RECORD.                               
000300     05  REGION-REGION                  PIC X(20).                
000400     05  REGION-CHANNEL                 PIC X(20).                
000500     05  REGION-REC-TYPE                PIC 9(4) COMP-3.          
000600     05  REGION-REC-FREQ                PIC 9(9) COMP-3.          
000700     05  REGION-TOTAL-SALES             PIC S9(9)V99 COMP-3.      
000800     05  REGION-TOTAL-QUANTITY          PIC S9(9)V99 COMP-3.      
000900     05  REGION-AVG-SALE                PIC S9(9)V99 COMP-3.      
