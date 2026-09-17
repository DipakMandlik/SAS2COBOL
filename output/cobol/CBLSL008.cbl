000100 IDENTIFICATION DIVISION.                                         
000200 PROGRAM-ID. CBLSL008.                                            
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
003200     COPY CPHVSD01.                                               
003300     COPY CPHVSC01.                                               
003400     COPY CPCPRF01.                                               
003500     COPY CPCPRS01.                                               
003600     COPY CPCSCR01.                                               
003700     COPY CPSCRS01.                                               
003800     COPY CPRSCB01.                                               
003900     COPY CPRSFL01.                                               
004000 PROCEDURE DIVISION.                                              
004100 0000-MAIN-LINE.                                                  
004200     PERFORM 1000-INITIALIZE.                                     
004300     PERFORM 2000-PROCESS-DATA UNTIL WS-IN-EOF.                   
004400     PERFORM 3000-TERMINATE.                                      
004500     STOP RUN.                                                    
004600 1000-INITIALIZE.                                                 
004700     OPEN INPUT IN-FILE.                                          
004800     PERFORM 9000-CHECK-IN-STATUS.                                
004900     OPEN OUTPUT OUT-FILE.                                        
005000     PERFORM 9100-CHECK-OUT-STATUS.                               
005100     PERFORM 2100-READ-IN-FILE.                                   
005200 2000-PROCESS-DATA.                                               
005300     IF STR-IS-PRESENT THEN                                       
005400         MOVE IN-RECORD TO OUT-RECORD                             
005500         ADD 1 TO WS-WRITE-CNT                                    
005600             ON SIZE ERROR DISPLAY 'WRITE COUNTER OVERFLOW'       
005700         WRITE OUT-RECORD                                         
005800         PERFORM 9100-CHECK-OUT-STATUS                            
005900     END-IF.                                                      
006000     PERFORM 2100-READ-IN-FILE.                                   
006100 2100-READ-IN-FILE.                                               
006200     READ IN-FILE                                                 
006300         AT END SET WS-IN-EOF TO TRUE                             
006400         NOT AT END ADD 1 TO WS-READ-CNT                          
006500             ON SIZE ERROR DISPLAY 'READ COUNTER OVERFLOW'        
006600     END-READ.                                                    
006700     IF NOT WS-IN-OK AND NOT WS-IN-EOF THEN                       
006800         PERFORM 9000-CHECK-IN-STATUS                             
006900     END-IF.                                                      
007000 3000-TERMINATE.                                                  
007100     CLOSE IN-FILE.                                               
007200     PERFORM 9000-CHECK-IN-STATUS.                                
007300     CLOSE OUT-FILE.                                              
007400     PERFORM 9100-CHECK-OUT-STATUS.                               
007500     DISPLAY 'CBLSL008 COMPLETED. READ: ' WS-READ-CNT ' WRITE: ' WS-WRITE-CNT.
007600 9000-CHECK-IN-STATUS.                                            
007700     IF NOT WS-IN-OK AND NOT WS-IN-EOF THEN                       
007800         DISPLAY 'FATAL ERROR ON IN-FILE STATUS: ' WS-IN-STATUS   
007900         MOVE 16 TO RETURN-CODE                                   
008000         STOP RUN                                                 
008100     END-IF.                                                      
008200 9100-CHECK-OUT-STATUS.                                           
008300     IF NOT WS-OUT-OK THEN                                        
008400         DISPLAY 'FATAL ERROR ON OUT-FILE STATUS: ' WS-OUT-STATUS 
008500         MOVE 16 TO RETURN-CODE                                   
008600         STOP RUN                                                 
008700     END-IF.                                                      
