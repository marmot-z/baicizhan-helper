/**
 * @see https://github.com/snowballstem/snowball
 * @see https://github.com/N8Brooks/snowball
 */
;(function(window) {
    'use strict';

    const {BaseStemmer} = window.__baicizhanHelperModule__;

    var EnglishStemmer = function () {
        var base = new BaseStemmer();
        /** @const */ var a_0 = [
          ["arsen", -1, -1],
          ["commun", -1, -1],
          ["gener", -1, -1],
        ];
      
        /** @const */ var a_1 = [
          ["'", -1, 1],
          ["'s'", 0, 1],
          ["'s", -1, 1],
        ];
      
        /** @const */ var a_2 = [
          ["ied", -1, 2],
          ["s", -1, 3],
          ["ies", 1, 2],
          ["sses", 1, 1],
          ["ss", 1, -1],
          ["us", 1, -1],
        ];
      
        /** @const */ var a_3 = [
          ["", -1, 3],
          ["bb", 0, 2],
          ["dd", 0, 2],
          ["ff", 0, 2],
          ["gg", 0, 2],
          ["bl", 0, 1],
          ["mm", 0, 2],
          ["nn", 0, 2],
          ["pp", 0, 2],
          ["rr", 0, 2],
          ["at", 0, 1],
          ["tt", 0, 2],
          ["iz", 0, 1],
        ];
      
        /** @const */ var a_4 = [
          ["ed", -1, 2],
          ["eed", 0, 1],
          ["ing", -1, 2],
          ["edly", -1, 2],
          ["eedly", 3, 1],
          ["ingly", -1, 2],
        ];
      
        /** @const */ var a_5 = [
          ["anci", -1, 3],
          ["enci", -1, 2],
          ["ogi", -1, 13],
          ["li", -1, 15],
          ["bli", 3, 12],
          ["abli", 4, 4],
          ["alli", 3, 8],
          ["fulli", 3, 9],
          ["lessli", 3, 14],
          ["ousli", 3, 10],
          ["entli", 3, 5],
          ["aliti", -1, 8],
          ["biliti", -1, 12],
          ["iviti", -1, 11],
          ["tional", -1, 1],
          ["ational", 14, 7],
          ["alism", -1, 8],
          ["ation", -1, 7],
          ["ization", 17, 6],
          ["izer", -1, 6],
          ["ator", -1, 7],
          ["iveness", -1, 11],
          ["fulness", -1, 9],
          ["ousness", -1, 10],
        ];
      
        /** @const */ var a_6 = [
          ["icate", -1, 4],
          ["ative", -1, 6],
          ["alize", -1, 3],
          ["iciti", -1, 4],
          ["ical", -1, 4],
          ["tional", -1, 1],
          ["ational", 5, 2],
          ["ful", -1, 5],
          ["ness", -1, 5],
        ];
      
        /** @const */ var a_7 = [
          ["ic", -1, 1],
          ["ance", -1, 1],
          ["ence", -1, 1],
          ["able", -1, 1],
          ["ible", -1, 1],
          ["ate", -1, 1],
          ["ive", -1, 1],
          ["ize", -1, 1],
          ["iti", -1, 1],
          ["al", -1, 1],
          ["ism", -1, 1],
          ["ion", -1, 2],
          ["er", -1, 1],
          ["ous", -1, 1],
          ["ant", -1, 1],
          ["ent", -1, 1],
          ["ment", 15, 1],
          ["ement", 16, 1],
        ];
      
        /** @const */ var a_8 = [
          ["e", -1, 1],
          ["l", -1, 2],
        ];
      
        /** @const */ var a_9 = [
          ["succeed", -1, -1],
          ["proceed", -1, -1],
          ["exceed", -1, -1],
          ["canning", -1, -1],
          ["inning", -1, -1],
          ["earring", -1, -1],
          ["herring", -1, -1],
          ["outing", -1, -1],
        ];
      
        /** @const */ var a_10 = [
          ["andes", -1, -1],
          ["atlas", -1, -1],
          ["bias", -1, -1],
          ["cosmos", -1, -1],
          ["dying", -1, 3],
          ["early", -1, 9],
          ["gently", -1, 7],
          ["howe", -1, -1],
          ["idly", -1, 6],
          ["lying", -1, 4],
          ["news", -1, -1],
          ["only", -1, 10],
          ["singly", -1, 11],
          ["skies", -1, 2],
          ["skis", -1, 1],
          ["sky", -1, -1],
          ["tying", -1, 5],
          ["ugly", -1, 8],
        ];
      
        /** @const */ var /** Array<int> */ g_v = [17, 65, 16, 1];
      
        /** @const */ var /** Array<int> */ g_v_WXY = [1, 17, 65, 208, 1];
      
        /** @const */ var /** Array<int> */ g_valid_LI = [55, 141, 2];
      
        var /** boolean */ B_Y_found = false;
        var /** number */ I_p2 = 0;
        var /** number */ I_p1 = 0;
      
        /** @return {boolean} */
        function r_prelude() {
          B_Y_found = false;
          var /** number */ v_1 = base.cursor;
          lab0: {
            base.bra = base.cursor;
            if (!base.eq_s("'")) {
              break lab0;
            }
            base.ket = base.cursor;
            if (!base.slice_del()) {
              return false;
            }
          }
          base.cursor = v_1;
          var /** number */ v_2 = base.cursor;
          lab1: {
            base.bra = base.cursor;
            if (!base.eq_s("y")) {
              break lab1;
            }
            base.ket = base.cursor;
            if (!base.slice_from("Y")) {
              return false;
            }
            B_Y_found = true;
          }
          base.cursor = v_2;
          var /** number */ v_3 = base.cursor;
          lab2: {
            while (true) {
              var /** number */ v_4 = base.cursor;
              lab3: {
                golab4: while (true) {
                  var /** number */ v_5 = base.cursor;
                  lab5: {
                    if (!base.in_grouping(g_v, 97, 121)) {
                      break lab5;
                    }
                    base.bra = base.cursor;
                    if (!base.eq_s("y")) {
                      break lab5;
                    }
                    base.ket = base.cursor;
                    base.cursor = v_5;
                    break golab4;
                  }
                  base.cursor = v_5;
                  if (base.cursor >= base.limit) {
                    break lab3;
                  }
                  base.cursor++;
                }
                if (!base.slice_from("Y")) {
                  return false;
                }
                B_Y_found = true;
                continue;
              }
              base.cursor = v_4;
              break;
            }
          }
          base.cursor = v_3;
          return true;
        }
      
        /** @return {boolean} */
        function r_mark_regions() {
          I_p1 = base.limit;
          I_p2 = base.limit;
          var /** number */ v_1 = base.cursor;
          lab0: {
            lab1: {
              var /** number */ v_2 = base.cursor;
              lab2: {
                if (base.find_among(a_0) == 0) {
                  break lab2;
                }
                break lab1;
              }
              base.cursor = v_2;
              golab3: while (true) {
                lab4: {
                  if (!base.in_grouping(g_v, 97, 121)) {
                    break lab4;
                  }
                  break golab3;
                }
                if (base.cursor >= base.limit) {
                  break lab0;
                }
                base.cursor++;
              }
              golab5: while (true) {
                lab6: {
                  if (!base.out_grouping(g_v, 97, 121)) {
                    break lab6;
                  }
                  break golab5;
                }
                if (base.cursor >= base.limit) {
                  break lab0;
                }
                base.cursor++;
              }
            }
            I_p1 = base.cursor;
            golab7: while (true) {
              lab8: {
                if (!base.in_grouping(g_v, 97, 121)) {
                  break lab8;
                }
                break golab7;
              }
              if (base.cursor >= base.limit) {
                break lab0;
              }
              base.cursor++;
            }
            golab9: while (true) {
              lab10: {
                if (!base.out_grouping(g_v, 97, 121)) {
                  break lab10;
                }
                break golab9;
              }
              if (base.cursor >= base.limit) {
                break lab0;
              }
              base.cursor++;
            }
            I_p2 = base.cursor;
          }
          base.cursor = v_1;
          return true;
        }
      
        /** @return {boolean} */
        function r_shortv() {
          lab0: {
            var /** number */ v_1 = base.limit - base.cursor;
            lab1: {
              if (!base.out_grouping_b(g_v_WXY, 89, 121)) {
                break lab1;
              }
              if (!base.in_grouping_b(g_v, 97, 121)) {
                break lab1;
              }
              if (!base.out_grouping_b(g_v, 97, 121)) {
                break lab1;
              }
              break lab0;
            }
            base.cursor = base.limit - v_1;
            if (!base.out_grouping_b(g_v, 97, 121)) {
              return false;
            }
            if (!base.in_grouping_b(g_v, 97, 121)) {
              return false;
            }
            if (base.cursor > base.limit_backward) {
              return false;
            }
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_R1() {
          if (!(I_p1 <= base.cursor)) {
            return false;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_R2() {
          if (!(I_p2 <= base.cursor)) {
            return false;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_Step_1a() {
          var /** number */ among_var;
          var /** number */ v_1 = base.limit - base.cursor;
          lab0: {
            base.ket = base.cursor;
            if (base.find_among_b(a_1) == 0) {
              base.cursor = base.limit - v_1;
              break lab0;
            }
            base.bra = base.cursor;
            if (!base.slice_del()) {
              return false;
            }
          }
          base.ket = base.cursor;
          among_var = base.find_among_b(a_2);
          if (among_var == 0) {
            return false;
          }
          base.bra = base.cursor;
          switch (among_var) {
            case 1:
              if (!base.slice_from("ss")) {
                return false;
              }
              break;
            case 2:
              lab1: {
                var /** number */ v_2 = base.limit - base.cursor;
                lab2: {
                  {
                    var /** number */ c1 = base.cursor - 2;
                    if (c1 < base.limit_backward) {
                      break lab2;
                    }
                    base.cursor = c1;
                  }
                  if (!base.slice_from("i")) {
                    return false;
                  }
                  break lab1;
                }
                base.cursor = base.limit - v_2;
                if (!base.slice_from("ie")) {
                  return false;
                }
              }
              break;
            case 3:
              if (base.cursor <= base.limit_backward) {
                return false;
              }
              base.cursor--;
              golab3: while (true) {
                lab4: {
                  if (!base.in_grouping_b(g_v, 97, 121)) {
                    break lab4;
                  }
                  break golab3;
                }
                if (base.cursor <= base.limit_backward) {
                  return false;
                }
                base.cursor--;
              }
              if (!base.slice_del()) {
                return false;
              }
              break;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_Step_1b() {
          var /** number */ among_var;
          base.ket = base.cursor;
          among_var = base.find_among_b(a_4);
          if (among_var == 0) {
            return false;
          }
          base.bra = base.cursor;
          switch (among_var) {
            case 1:
              if (!r_R1()) {
                return false;
              }
              if (!base.slice_from("ee")) {
                return false;
              }
              break;
            case 2:
              var /** number */ v_1 = base.limit - base.cursor;
              golab0: while (true) {
                lab1: {
                  if (!base.in_grouping_b(g_v, 97, 121)) {
                    break lab1;
                  }
                  break golab0;
                }
                if (base.cursor <= base.limit_backward) {
                  return false;
                }
                base.cursor--;
              }
              base.cursor = base.limit - v_1;
              if (!base.slice_del()) {
                return false;
              }
              var /** number */ v_3 = base.limit - base.cursor;
              among_var = base.find_among_b(a_3);
              if (among_var == 0) {
                return false;
              }
              base.cursor = base.limit - v_3;
              switch (among_var) {
                case 1:
                  {
                    var /** number */ c1 = base.cursor;
                    base.insert(base.cursor, base.cursor, "e");
                    base.cursor = c1;
                  }
                  break;
                case 2:
                  base.ket = base.cursor;
                  if (base.cursor <= base.limit_backward) {
                    return false;
                  }
                  base.cursor--;
                  base.bra = base.cursor;
                  if (!base.slice_del()) {
                    return false;
                  }
                  break;
                case 3:
                  if (base.cursor != I_p1) {
                    return false;
                  }
                  var /** number */ v_4 = base.limit - base.cursor;
                  if (!r_shortv()) {
                    return false;
                  }
                  base.cursor = base.limit - v_4;
                  {
                    var /** number */ c2 = base.cursor;
                    base.insert(base.cursor, base.cursor, "e");
                    base.cursor = c2;
                  }
                  break;
              }
              break;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_Step_1c() {
          base.ket = base.cursor;
          lab0: {
            var /** number */ v_1 = base.limit - base.cursor;
            lab1: {
              if (!base.eq_s_b("y")) {
                break lab1;
              }
              break lab0;
            }
            base.cursor = base.limit - v_1;
            if (!base.eq_s_b("Y")) {
              return false;
            }
          }
          base.bra = base.cursor;
          if (!base.out_grouping_b(g_v, 97, 121)) {
            return false;
          }
          lab2: {
            if (base.cursor > base.limit_backward) {
              break lab2;
            }
            return false;
          }
          if (!base.slice_from("i")) {
            return false;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_Step_2() {
          var /** number */ among_var;
          base.ket = base.cursor;
          among_var = base.find_among_b(a_5);
          if (among_var == 0) {
            return false;
          }
          base.bra = base.cursor;
          if (!r_R1()) {
            return false;
          }
          switch (among_var) {
            case 1:
              if (!base.slice_from("tion")) {
                return false;
              }
              break;
            case 2:
              if (!base.slice_from("ence")) {
                return false;
              }
              break;
            case 3:
              if (!base.slice_from("ance")) {
                return false;
              }
              break;
            case 4:
              if (!base.slice_from("able")) {
                return false;
              }
              break;
            case 5:
              if (!base.slice_from("ent")) {
                return false;
              }
              break;
            case 6:
              if (!base.slice_from("ize")) {
                return false;
              }
              break;
            case 7:
              if (!base.slice_from("ate")) {
                return false;
              }
              break;
            case 8:
              if (!base.slice_from("al")) {
                return false;
              }
              break;
            case 9:
              if (!base.slice_from("ful")) {
                return false;
              }
              break;
            case 10:
              if (!base.slice_from("ous")) {
                return false;
              }
              break;
            case 11:
              if (!base.slice_from("ive")) {
                return false;
              }
              break;
            case 12:
              if (!base.slice_from("ble")) {
                return false;
              }
              break;
            case 13:
              if (!base.eq_s_b("l")) {
                return false;
              }
              if (!base.slice_from("og")) {
                return false;
              }
              break;
            case 14:
              if (!base.slice_from("less")) {
                return false;
              }
              break;
            case 15:
              if (!base.in_grouping_b(g_valid_LI, 99, 116)) {
                return false;
              }
              if (!base.slice_del()) {
                return false;
              }
              break;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_Step_3() {
          var /** number */ among_var;
          base.ket = base.cursor;
          among_var = base.find_among_b(a_6);
          if (among_var == 0) {
            return false;
          }
          base.bra = base.cursor;
          if (!r_R1()) {
            return false;
          }
          switch (among_var) {
            case 1:
              if (!base.slice_from("tion")) {
                return false;
              }
              break;
            case 2:
              if (!base.slice_from("ate")) {
                return false;
              }
              break;
            case 3:
              if (!base.slice_from("al")) {
                return false;
              }
              break;
            case 4:
              if (!base.slice_from("ic")) {
                return false;
              }
              break;
            case 5:
              if (!base.slice_del()) {
                return false;
              }
              break;
            case 6:
              if (!r_R2()) {
                return false;
              }
              if (!base.slice_del()) {
                return false;
              }
              break;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_Step_4() {
          var /** number */ among_var;
          base.ket = base.cursor;
          among_var = base.find_among_b(a_7);
          if (among_var == 0) {
            return false;
          }
          base.bra = base.cursor;
          if (!r_R2()) {
            return false;
          }
          switch (among_var) {
            case 1:
              if (!base.slice_del()) {
                return false;
              }
              break;
            case 2:
              lab0: {
                var /** number */ v_1 = base.limit - base.cursor;
                lab1: {
                  if (!base.eq_s_b("s")) {
                    break lab1;
                  }
                  break lab0;
                }
                base.cursor = base.limit - v_1;
                if (!base.eq_s_b("t")) {
                  return false;
                }
              }
              if (!base.slice_del()) {
                return false;
              }
              break;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_Step_5() {
          var /** number */ among_var;
          base.ket = base.cursor;
          among_var = base.find_among_b(a_8);
          if (among_var == 0) {
            return false;
          }
          base.bra = base.cursor;
          switch (among_var) {
            case 1:
              lab0: {
                var /** number */ v_1 = base.limit - base.cursor;
                lab1: {
                  if (!r_R2()) {
                    break lab1;
                  }
                  break lab0;
                }
                base.cursor = base.limit - v_1;
                if (!r_R1()) {
                  return false;
                }
                {
                  var /** number */ v_2 = base.limit - base.cursor;
                  lab2: {
                    if (!r_shortv()) {
                      break lab2;
                    }
                    return false;
                  }
                  base.cursor = base.limit - v_2;
                }
              }
              if (!base.slice_del()) {
                return false;
              }
              break;
            case 2:
              if (!r_R2()) {
                return false;
              }
              if (!base.eq_s_b("l")) {
                return false;
              }
              if (!base.slice_del()) {
                return false;
              }
              break;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_exception2() {
          base.ket = base.cursor;
          if (base.find_among_b(a_9) == 0) {
            return false;
          }
          base.bra = base.cursor;
          if (base.cursor > base.limit_backward) {
            return false;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_exception1() {
          var /** number */ among_var;
          base.bra = base.cursor;
          among_var = base.find_among(a_10);
          if (among_var == 0) {
            return false;
          }
          base.ket = base.cursor;
          if (base.cursor < base.limit) {
            return false;
          }
          switch (among_var) {
            case 1:
              if (!base.slice_from("ski")) {
                return false;
              }
              break;
            case 2:
              if (!base.slice_from("sky")) {
                return false;
              }
              break;
            case 3:
              if (!base.slice_from("die")) {
                return false;
              }
              break;
            case 4:
              if (!base.slice_from("lie")) {
                return false;
              }
              break;
            case 5:
              if (!base.slice_from("tie")) {
                return false;
              }
              break;
            case 6:
              if (!base.slice_from("idl")) {
                return false;
              }
              break;
            case 7:
              if (!base.slice_from("gentl")) {
                return false;
              }
              break;
            case 8:
              if (!base.slice_from("ugli")) {
                return false;
              }
              break;
            case 9:
              if (!base.slice_from("earli")) {
                return false;
              }
              break;
            case 10:
              if (!base.slice_from("onli")) {
                return false;
              }
              break;
            case 11:
              if (!base.slice_from("singl")) {
                return false;
              }
              break;
          }
          return true;
        }
      
        /** @return {boolean} */
        function r_postlude() {
          if (!B_Y_found) {
            return false;
          }
          while (true) {
            var /** number */ v_1 = base.cursor;
            lab0: {
              golab1: while (true) {
                var /** number */ v_2 = base.cursor;
                lab2: {
                  base.bra = base.cursor;
                  if (!base.eq_s("Y")) {
                    break lab2;
                  }
                  base.ket = base.cursor;
                  base.cursor = v_2;
                  break golab1;
                }
                base.cursor = v_2;
                if (base.cursor >= base.limit) {
                  break lab0;
                }
                base.cursor++;
              }
              if (!base.slice_from("y")) {
                return false;
              }
              continue;
            }
            base.cursor = v_1;
            break;
          }
          return true;
        }
      
        this.stem = /** @return {boolean} */ function () {
          lab0: {
            var /** number */ v_1 = base.cursor;
            lab1: {
              if (!r_exception1()) {
                break lab1;
              }
              break lab0;
            }
            base.cursor = v_1;
            lab2: {
              {
                var /** number */ v_2 = base.cursor;
                lab3: {
                  {
                    var /** number */ c1 = base.cursor + 3;
                    if (c1 > base.limit) {
                      break lab3;
                    }
                    base.cursor = c1;
                  }
                  break lab2;
                }
                base.cursor = v_2;
              }
              break lab0;
            }
            base.cursor = v_1;
            r_prelude();
            r_mark_regions();
            base.limit_backward = base.cursor;
            base.cursor = base.limit;
            var /** number */ v_5 = base.limit - base.cursor;
            r_Step_1a();
            base.cursor = base.limit - v_5;
            lab4: {
              var /** number */ v_6 = base.limit - base.cursor;
              lab5: {
                if (!r_exception2()) {
                  break lab5;
                }
                break lab4;
              }
              base.cursor = base.limit - v_6;
              var /** number */ v_7 = base.limit - base.cursor;
              r_Step_1b();
              base.cursor = base.limit - v_7;
              var /** number */ v_8 = base.limit - base.cursor;
              r_Step_1c();
              base.cursor = base.limit - v_8;
              var /** number */ v_9 = base.limit - base.cursor;
              r_Step_2();
              base.cursor = base.limit - v_9;
              var /** number */ v_10 = base.limit - base.cursor;
              r_Step_3();
              base.cursor = base.limit - v_10;
              var /** number */ v_11 = base.limit - base.cursor;
              r_Step_4();
              base.cursor = base.limit - v_11;
              var /** number */ v_12 = base.limit - base.cursor;
              r_Step_5();
              base.cursor = base.limit - v_12;
            }
            base.cursor = base.limit_backward;
            var /** number */ v_13 = base.cursor;
            r_postlude();
            base.cursor = v_13;
          }
          return true;
        };
      
        /**@return{string}*/
        this["stemWord"] = function (/**string*/ word) {
          base.setCurrent(word);
          this.stem();
          return base.getCurrent();
        };
    };

    if (!window.__baicizhanHelperModule__) {
        window.__baicizhanHelperModule__ = {};
    }

    window.__baicizhanHelperModule__.EnglishStemmer = EnglishStemmer;
} (this));