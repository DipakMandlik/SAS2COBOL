000100*================================================================*
000200* CPDATES0: STANDARD DATE STRUCTURE & CALCULATION FIELDS         *
000300*================================================================*
000400 01  WS-DATE-BLOCK.
000500     05  WS-CURRENT-DATE-CCYYMMDD.
000600         10  WS-CURR-CCYY              PIC 9(4).
000700         10  WS-CURR-MM                PIC 9(2).
000800         10  WS-CURR-DD                PIC 9(2).
000900     05  WS-JULIAN-DATE.
001000         10  WS-JUL-YY                 PIC 9(2).
001100         10  WS-JUL-DDD                PIC 9(3).
001200     05  WS-DAYS-ELAPSED               PIC S9(5) COMP-3 VALUE ZERO.
