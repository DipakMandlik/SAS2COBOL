000100 * COPYBOOK: CPREGI51 - FOR WORKLIB.REGION_CHANGE_SUMMARY         
000200 01  REGION-CHANGE-SUMMARY-RECORD.                                
000300     05  REGION-REGION                  PIC X(20).                
000400     05  REGION-REC-TYPE                PIC 9(4) COMP-3.          
000500     05  REGION-REC-FREQ                PIC 9(9) COMP-3.          
000600     05  REGION-NET-CHANGE              PIC S9(9)V99 COMP-3.      
000700     05  REGION-MAXIMUM-CHANGE          PIC S9(9)V99 COMP-3.      
000800     05  REGION-MINIMUM-CHANGE          PIC S9(9)V99 COMP-3.      
