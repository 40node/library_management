/* eslint-env jasmine */
const book = require('../controllers/bookProvider');

describe('#bookProvider', () => {
  let req, res;
  beforeEach(() => {
    req = {
      params: {
        book_title: 'title',
        author: 'しょっさん',
        publisher: 'USP研究所',
        image_uml: ''
      }
    };
    res = {
      redirect: function () { },
      render: function () { }
    };
  });

  describe('#find', () => {
    describe('#read_content', () => {
      it('ID=1 の本とコメントを入手する', (done) => {
        book.get_book(1)
          .then(result => {
            expect(result.id).toBe(1);
            expect(result.Comments.length).toBe(3);
            done();
          }).catch(done.fail);
      });
      it('対象の本とコメントがない', (done) => {
        book.get_book(null)
          .then(result => {
            expect(result).toBeNull();
            done();
          }).catch(done.fail);
      });
      it('本が登録されていれば、本の内容が表示される', (done) => {
        req.params.id = 1;
        res.render = (view, stacks) => {
          expect(view).toBe('description');
          expect(stacks.author).toBe('しょっさん');
          done();
        };
        book.find(req, res);
      });
    });
  });

  describe('#view', () => {
    describe('#get_contents', () => {
      it('2冊以上の本が登録されている', (done) => {
        book.get_contents()
          .then(results => {
            expect(results.length).toBeGreaterThanOrEqual(2);
            expect(results[0].id).toBe(1);
            expect(results[1].id).toBe(2);
            done();
          }).catch(done.fail);
      });
      it('本の一覧を表示する', (done) => {
        res.render = (view, stacks) => {
          expect(view).toBe('view');
          expect(stacks[0].id).toBe(1);
          expect(stacks[1].author).toBe('しょっさん');
          done();
        };
        book.view(req, res);
      });
    });
  });

  describe('#create', () => {
    describe('#validate()', () => {
      it('入力された値に問題がない', () => {
        const result = book.validate(req.params);
        expect(result).toBe(true);
        expect(req.params.image_url).toBe('http://example.com/');
      });
      it('タイトルが入っていない場合はエラーになる', () => {
        req.params.book_title = '';
        const result = book.validate(req.params);
        expect(result).toBe(false);
        expect(req.params.errors).toEqual(['本のタイトルが入っていません']);
      });
    });

    describe('#newOne', () => {
      it('本が登録できる', (done) => {
        book.newOne(req.params).then(result => {
          expect(result.book_title).toBe('title');
          expect(result.id).toBeGreaterThanOrEqual(2);
          expect(result.image_url).toBe('http://example.com/');
          done();
        }).catch(done.fail);
      });
      it('本のタイトルが未登録だと登録できない', (done) => {
        req.params.book_title = '';
        book.newOne(req.params).then(done.fail)
          .catch(result => {
            expect(result).toEqual(['本のタイトルが入っていません']);
            done();
          });
      });
    });

    describe('#create', () => {
      it('本が正常に登録される場合は Redirect される', (done) => {
        res.redirect = (uri) => {
          expect(uri).toMatch(/^\/books\/[0-9]+$/);
          done();
        };
        book.create(req, res);
      });
      it('本が正常に登録されない場合はエラーページが rendering される', (done) => {
        req.params.book_title = '';
        res.render = (view, stacks) => {
          expect(view).toBe('error');
          expect(stacks.message).toBe('エラーが発生しました.');
          done();
        };
        book.create(req, res);
      });
    });

    describe('#remove_book', () => {
      it('正常に削除されている', (done) => {
        book.newOne(req.params).then(result => {
          book.remove_book(result.id).then(num => {
            expect(num).toBe(1);
            done();
          }).catch(done.fail);
        }).catch(done.fail);
      });
      it('コメントのついているものは削除できない', (done) => {
        book.remove_book(1).then(done.fail)
          .catch(result => {
            expect(result.name).toBe('SequelizeForeignKeyConstraintError');
            done();
          });
      });
    });
    describe('#destroy', () => {
      it('正常に削除できる', (done) => {
        book.newOne(req.params).then(result => {
          req.params.id = result.id;
          res.redirect = (uri) => {
            expect(uri).toBe('/books/');
            done();
          };
          book.destroy(req, res);
        });
      });
      it('本が正常に削除されない場合はエラーページが rendering される', (done) => {
        req.params.id = 1;
        res.render = (view, stacks) => {
          expect(view).toBe('error');
          expect(stacks.message).toBe('エラーが発生しました.');
          done();
        };
        book.destroy(req, res);
      });
    });
  });
});