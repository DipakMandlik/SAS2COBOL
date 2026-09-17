000100 * COPYBOOK: CPREGI54 - FOR WORKLIB.REGION_CONTROLS               
000200 01  REGION-CONTROLS-RECORD.                                      
000300     05  REGION-CUSTOMER-REGION         PIC X(20).                
000400     05  REGION-SALES                   PIC S9(9)V99 COMP-3.      
000500     05  REGION-TRANSACTIONS            PIC S9(9)V99 COMP-3.      
000600     05  REGION-AVERAGE-SALE            PIC S9(9)V99 COMP-3.      
000700     05  REGION-UNITS                   PIC S9(9)V99 COMP-3.      
000800     05  REGION-CONTROL-FLAG            PIC X(12).                
000900     05  REGION-CONTROL-REASON          PIC X(100).               
