000100 IDENTIFICATION DIVISION.                                         
000200 PROGRAM-ID. CBLSL010.                                            
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
003200     COPY CPSQAL01.                                               
003300     COPY CPQFRQ01.                                               
003400     COPY CPQSUM01.                                               
003500 PROCEDURE DIVISION.                                              
003600 0000-MAIN-LINE.                                                  
003700     PERFORM 1000-INITIALIZE.                                     
003800     PERFORM 2000-PROCESS-DATA UNTIL WS-IN-EOF.                   
003900     PERFORM 3000-TERMINATE.                                      
004000     STOP RUN.                                                    
004100 1000-INITIALIZE.                                                 
004200     OPEN INPUT IN-FILE.                                          
004300     PERFORM 9000-CHECK-IN-STATUS.                                
004400     OPEN OUTPUT OUT-FILE.                                        
004500     PERFORM 9100-CHECK-OUT-STATUS.                               
004600     PERFORM 2100-READ-IN-FILE.                                   
004700 2000-PROCESS-DATA.                                               
004800     IF STR-IS-PRESENT THEN                                       
004900         MOVE IN-RECORD TO OUT-RECORD                             
005000         ADD 1 TO WS-WRITE-CNT                                    
005100             ON SIZE ERROR DISPLAY 'WRITE COUNTER OVERFLOW'       
005200         WRITE OUT-RECORD                                         
005300         PERFORM 9100-CHECK-OUT-STATUS                            
005400     END-IF.                                                      
005500     PERFORM 2100-READ-IN-FILE.                                   
005600 2100-READ-IN-FILE.                                               
005700     READ IN-FILE                                                 
005800         AT END SET WS-IN-EOF TO TRUE                             
005900         NOT AT END ADD 1 TO WS-READ-CNT                          
006000             ON SIZE ERROR DISPLAY 'READ COUNTER OVERFLOW'        
006100     END-READ.                                                    
006200     IF NOT WS-IN-OK AND NOT WS-IN-EOF THEN                       
006300         PERFORM 9000-CHECK-IN-STATUS                             
006400     END-IF.                                                      
006500 3000-TERMINATE.                                                  
006600     CLOSE IN-FILE.                                               
006700     PERFORM 9000-CHECK-IN-STATUS.                                
006800     CLOSE OUT-FILE.                                              
006900     PERFORM 9100-CHECK-OUT-STATUS.                               
007000     DISPLAY 'CBLSL010 COMPLETED. READ: ' WS-READ-CNT ' WRITE: ' WS-WRITE-CNT.
007100 9000-CHECK-IN-STATUS.                                            
007200     IF NOT WS-IN-OK AND NOT WS-IN-EOF THEN                       
007300         DISPLAY 'FATAL ERROR ON IN-FILE STATUS: ' WS-IN-STATUS   
007400         MOVE 16 TO RETURN-CODE                                   
007500         STOP RUN                                                 
007600     END-IF.                                                      
007700 9100-CHECK-OUT-STATUS.                                           
007800     IF NOT WS-OUT-OK THEN                                        
007900         DISPLAY 'FATAL ERROR ON OUT-FILE STATUS: ' WS-OUT-STATUS 
008000         MOVE 16 TO RETURN-CODE                                   
008100         STOP RUN                                                 
008200     END-IF.                                                      
