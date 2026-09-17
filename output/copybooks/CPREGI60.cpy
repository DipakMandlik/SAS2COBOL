000100 * COPYBOOK: CPREGI60 - FOR WORKLIB.REGION_REPORT_INPUT           
000200 01  REGION-REPORT-INPUT-RECORD.                                  
000300     05  REGION-SALE-ID                 PIC S9(9) COMP-3.         
000400     05  REGION-SALE-DATE               PIC 9(8).                 
000500     05  REGION-CUSTOMER-ID             PIC S9(9) COMP-3.         
000600     05  REGION-CUSTOMER-NAME           PIC X(80).                
000700     05  REGION-SEGMENT                 PIC X(20).                
000800     05  REGION-CUSTOMER-REGION         PIC X(20).                
000900     05  REGION-PRODUCT-ID              PIC S9(9) COMP-3.         
001000     05  REGION-PRODUCT-NAME            PIC X(100).               
001100     05  REGION-CATEGORY                PIC X(40).                
001200     05  REGION-SUBCATEGORY             PIC X(40).                
001300     05  REGION-QUANTITY                PIC S9(9)V99 COMP-3.      
001400     05  REGION-UNIT-PRICE              PIC S9(9)V99 COMP-3.      
001500     05  REGION-DISCOUNT-PCT            PIC S9(9)V99 COMP-3.      
001600     05  REGION-GROSS-AMOUNT            PIC S9(9)V99 COMP-3.      
001700     05  REGION-DISCOUNT-AMOUNT         PIC S9(9)V99 COMP-3.      
001800     05  REGION-NET-AMOUNT              PIC S9(9)V99 COMP-3.      
