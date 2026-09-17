000100 * COPYBOOK: CPENRI28 - FOR WORKLIB.ENRICHED_SALES                
000200 01  ENRICHED-SALES-RECORD.                                       
000300     05  ENRICH-SALE-ID                 PIC S9(9) COMP-3.         
000400     05  ENRICH-SALE-DATE               PIC 9(8).                 
000500     05  ENRICH-CUSTOMER-ID             PIC S9(9) COMP-3.         
000600     05  ENRICH-CUSTOMER-NAME           PIC X(80).                
000700     05  ENRICH-SEGMENT                 PIC X(20).                
000800     05  ENRICH-CUSTOMER-REGION         PIC X(20).                
000900     05  ENRICH-PRODUCT-ID              PIC S9(9) COMP-3.         
001000     05  ENRICH-PRODUCT-NAME            PIC X(100).               
001100     05  ENRICH-CATEGORY                PIC X(40).                
001200     05  ENRICH-SUBCATEGORY             PIC X(40).                
001300     05  ENRICH-QUANTITY                PIC S9(9)V99 COMP-3.      
001400     05  ENRICH-UNIT-PRICE              PIC S9(9)V99 COMP-3.      
001500     05  ENRICH-DISCOUNT-PCT            PIC S9(9)V99 COMP-3.      
001600     05  ENRICH-GROSS-AMOUNT            PIC S9(9)V99 COMP-3.      
001700     05  ENRICH-DISCOUNT-AMOUNT         PIC S9(9)V99 COMP-3.      
001800     05  ENRICH-NET-AMOUNT              PIC S9(9)V99 COMP-3.      
001900     05  ENRICH-VALUE-BAND              PIC X(10).                
002000     05  ENRICH-PRICING-BAND            PIC X(12).                
