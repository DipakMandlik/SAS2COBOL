000100 IDENTIFICATION DIVISION.                                         
000200 PROGRAM-ID. CBLSL001.                                            
000300 AUTHOR. MAINFRAME ARCHITECT - SAS MIGRATION PLATFORM.            
000400 ENVIRONMENT DIVISION.                                            
000500 CONFIGURATION SECTION.                                           
000600 SOURCE-COMPUTER. IBM-ZOS.                                        
000700 OBJECT-COMPUTER. IBM-ZOS.                                        
000800 INPUT-OUTPUT SECTION.                                            
000900 FILE-CONTROL.                                                    
001000     SELECT IN-FILE ASSIGN TO INFILE                              
001100         FILE STATUS IS WS-IN-STATUS.                             
001200     SELECT OUT-FILE ASSIGN TO OUTFILE                            
001300         FILE STATUS IS WS-OUT-STATUS.                            
001400 DATA DIVISION.                                                   
001500 FILE SECTION.                                                    
001600 FD  IN-FILE.                                                     
001700 01  IN-RECORD PIC X(256).                                        
001800 FD  OUT-FILE.                                                    
001900 01  OUT-RECORD PIC X(256).                                       
002000 WORKING-STORAGE SECTION.                                         
002100 01  WS-IN-STATUS PIC X(2) VALUE '00'.                            
002200     88 WS-IN-OK VALUE '00'.                                      
002300     88 WS-IN-EOF VALUE '10'.                                     
002400 01  WS-OUT-STATUS PIC X(2) VALUE '00'.                           
002500     88 WS-OUT-OK VALUE '00'.                                     
002600 01  WS-COUNTERS.                                                 
002700         05 WS-READ-CNT PIC S9(9) COMP-3 VALUE ZERO.              
002800         05 WS-WRITE-CNT PIC S9(9) COMP-3 VALUE ZERO.             
002900         05 WS-CALC-VAL PIC S9(13)V99 COMP-3 VALUE ZERO.          
003000     COPY CPCOMM01.                                               
003100     COPY CPTRAP88.                                               
003200     COPY CPRAW01.                                                
003300     COPY CPRAW02.                                                
003400     COPY CPRAW03.                                                
003500     COPY CPCUST01.                                               
003600     COPY CPPROD01.                                               
003700     COPY CPSALE01.                                               
003800 PROCEDURE DIVISION.                                              
003900 0000-MAIN-LINE.                                                  
004000     PERFORM 1000-INITIALIZE.                                     
004100     PERFORM 2000-PROCESS-DATA UNTIL WS-IN-EOF.                   
004200     PERFORM 3000-TERMINATE.                                      
004300     STOP RUN.                                                    
004400 1000-INITIALIZE.                                                 
004500     OPEN INPUT IN-FILE.                                          
004600     PERFORM 9000-CHECK-IN-STATUS.                                
004700     OPEN OUTPUT OUT-FILE.                                        
004800     PERFORM 9100-CHECK-OUT-STATUS.                               
004900     PERFORM 2100-READ-IN-FILE.                                   
005000 2000-PROCESS-DATA.                                               
005100     IF STR-IS-PRESENT THEN                                       
005200         MOVE IN-RECORD TO OUT-RECORD                             
005300         ADD 1 TO WS-WRITE-CNT                                    
005400             ON SIZE ERROR DISPLAY 'WRITE COUNTER OVERFLOW'       
005500         WRITE OUT-RECORD                                         
005600         PERFORM 9100-CHECK-OUT-STATUS                            
005700     END-IF.                                                      
005800     PERFORM 2100-READ-IN-FILE.                                   
005900 2100-READ-IN-FILE.                                               
006000     READ IN-FILE                                                 
006100         AT END SET WS-IN-EOF TO TRUE                             
006200         NOT AT END ADD 1 TO WS-READ-CNT                          
006300             ON SIZE ERROR DISPLAY 'READ COUNTER OVERFLOW'        
006400     END-READ.                                                    
006500     IF NOT WS-IN-OK AND NOT WS-IN-EOF THEN                       
006600         PERFORM 9000-CHECK-IN-STATUS                             
006700     END-IF.                                                      
006800 3000-TERMINATE.                                                  
006900     CLOSE IN-FILE.                                               
007000     PERFORM 9000-CHECK-IN-STATUS.                                
007100     CLOSE OUT-FILE.                                              
007200     PERFORM 9100-CHECK-OUT-STATUS.                               
007300     DISPLAY 'CBLSL001 COMPLETED. READ: ' WS-READ-CNT ' WRITE: ' WS-WRITE-CNT.
007400 9000-CHECK-IN-STATUS.                                            
007500     IF NOT WS-IN-OK AND NOT WS-IN-EOF THEN                       
007600         DISPLAY 'FATAL ERROR ON IN-FILE STATUS: ' WS-IN-STATUS   
007700         MOVE 16 TO RETURN-CODE                                   
007800         STOP RUN                                                 
007900     END-IF.                                                      
008000 9100-CHECK-OUT-STATUS.                                           
008100     IF NOT WS-OUT-OK THEN                                        
008200         DISPLAY 'FATAL ERROR ON OUT-FILE STATUS: ' WS-OUT-STATUS 
008300         MOVE 16 TO RETURN-CODE                                   
008400         STOP RUN                                                 
008500     END-IF.                                                      
