000100 * COPYBOOK: CPREGI62 - FOR WORKLIB.REGION_SUMMARY                
000200 01  REGION-SUMMARY-RECORD.                                       
000300     05  REGION-REGION                  PIC X(20).                
000400     05  REGION-CHANNEL                 PIC X(20).                
000500     05  REGION-REC-TYPE                PIC 9(4) COMP-3.          
000600     05  REGION-REC-FREQ                PIC 9(9) COMP-3.          
000700     05  REGION-MEAN-NET                PIC S9(9)V99 COMP-3.      
000800     05  REGION-STD-NET                 PIC S9(9)V99 COMP-3.      
000900     05  REGION-MIN-NET                 PIC S9(9)V99 COMP-3.      
001000     05  REGION-MAX-NET                 PIC S9(9)V99 COMP-3.      
