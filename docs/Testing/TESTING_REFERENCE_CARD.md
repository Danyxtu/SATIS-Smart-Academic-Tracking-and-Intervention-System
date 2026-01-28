# 🧪 Testing Quick Reference Card

**Print this or bookmark it for quick access!**

---

## 📚 Which Document to Read?

| Need | Read This | Time |
|------|-----------|------|
| Understand testing | TESTING_SUMMARY.md | 5 min |
| Get started fast | TESTING_QUICK_START.md | 15 min |
| Test via browser | MANUAL_TESTING_GUIDE.md | 45 min |
| Learn everything | TESTING_GUIDE.md | 60 min |
| Plan & track | TESTING_IMPLEMENTATION_PLAN.md | 30 min |
| Visual overview | TESTING_VISUAL_OVERVIEW.md | 10 min |
| Find a doc | TESTING_DOCUMENTATION_INDEX.md | 5 min |

---

## ⚡ Quick Commands

```bash
# Setup
php artisan migrate:fresh --seed

# Run All Tests
php artisan test

# Run Specific Test
php artisan test tests/Feature/Auth/AuthenticationTest.php

# Run Pattern
php artisan test --filter=login

# Watch Mode
php artisan test --watch

# Coverage Report
php artisan test --coverage

# Verbose
php artisan test --verbose

# Stop on Failure
php artisan test --stop-on-failure

# Parallel (Faster)
php artisan test --parallel
```

---

## 🎯 Testing Pyramid

```
       🧪 E2E Tests
       (UI Testing)
          /\
         /  \
        /    \
       /______\
       
      Feature Tests
    (HTTP, Database)
       /\
      /  \
     /    \
    /______\
    
   Unit Tests
  (Functions)
    /\
   /  \
  /    \
 /______\
```

---

## 📝 Test Template

```php
test('what should happen', function () {
    // ARRANGE: Setup
    $user = User::factory()->create(['role' => 'student']);
    
    // ACT: Do action
    $response = $this->actingAs($user)->get('/dashboard');
    
    // ASSERT: Verify
    $response->assertOk();
});
```

---

## ✅ Common Assertions

```php
// Response Status
$response->assertOk();              // 200
$response->assertCreated();         // 201
$response->assertRedirect();        // 302
$response->assertUnauthorized();    // 401
$response->assertForbidden();       // 403
$response->assertNotFound();        // 404

// Auth
$this->assertAuthenticated();
$this->assertGuest();
$this->actingAs($user);

// Database
$this->assertDatabaseHas('users', ['email' => 'test@example.com']);
$this->assertDatabaseMissing('users', ['email' => 'deleted@example.com']);

// View/Component
$response->assertViewIs('dashboard');
$response->assertInertia(fn ($page) => $page->has('data'));

// JSON
$response->assertJson(['success' => true]);
$response->assertJsonStructure(['data' => ['id', 'name']]);
```

---

## 🐛 Fixing Failed Tests

| Error | Solution |
|-------|----------|
| "Table does not exist" | `php artisan migrate --env=testing` |
| "Undefined method" | Check method exists in model |
| "Factory not found" | Verify factory in `database/factories/` |
| 403 Forbidden | Check user role matches requirement |
| "CSRF token mismatch" | Use `withoutMiddleware('csrf')` |
| Tests slow | Add `--parallel` flag |
| Can't read output | Add `--verbose` flag |

---

## 📊 4-Week Timeline

```
WEEK 1: Manual Testing
├─ Day 1-2: Setup & learn
├─ Day 3-4: Test portals
└─ Day 5: Bug report

WEEK 2: Start Auto Tests
├─ Day 1: Run tests
├─ Day 2-3: Learn structure
└─ Day 4-5: Write tests (20 tests, 50% coverage)

WEEK 3: Expand Tests
├─ Day 1-3: Write more tests
├─ Day 4-5: Fix bugs & edge cases
└─ Result: (80 tests, 80% coverage)

WEEK 4: Finalize
├─ Day 1-3: Final tests
├─ Day 4: Review & polish
└─ Day 5: Production ready! 🚀
```

---

## 🎓 Test Types Explained

### Unit Test
- Tests one function/method
- Isolated from database
- Fast: milliseconds
- Example: `test('password hashes correctly')`

### Feature Test
- Tests complete workflow
- Uses database
- Fast: seconds
- Example: `test('user can login')`

### E2E Test
- Tests through UI
- Simulates real user
- Slow: seconds/minutes
- Example: Click, type, verify visually

---

## 🚨 Must-Test Features

- [ ] Each role can login
- [ ] Each role sees correct dashboard
- [ ] Users can't access wrong dashboards
- [ ] CRUD operations work (Create, Read, Update, Delete)
- [ ] Authorization working (403 errors for unauthorized)
- [ ] Data saved to database
- [ ] Relationships correct
- [ ] Validations working
- [ ] Error messages appear
- [ ] Emails sent
- [ ] PDF exports work
- [ ] Works on mobile

---

## 🎯 Success Criteria

```
✅ WEEK 1: Manual testing complete
   └─ Bug report with 10+ issues

✅ WEEK 2: Automated tests started
   └─ 20 tests passing, 50% coverage

✅ WEEK 3: Expanded coverage
   └─ 80 tests passing, 80% coverage

✅ WEEK 4: Production ready
   └─ 100+ tests, 85% coverage 🚀
```

---

## 📋 Daily Checklist

```markdown
[ ] Run tests: php artisan test
[ ] Check coverage: php artisan test --coverage
[ ] Read error messages carefully
[ ] Fix failing tests immediately
[ ] Write new tests for new features
[ ] Commit tests with code
[ ] Track coverage %
[ ] Review test quality
```

---

## 💡 Pro Tips

1. **Test While Coding**
   - Use `php artisan test --watch`
   - Tests run automatically on save

2. **One Test Per Idea**
   ```php
   test('user can login');
   test('user cannot login with wrong password');
   // NOT: test('user can login and logout');
   ```

3. **Use Factories**
   ```php
   $user = User::factory()->create();  // ✅ Good
   $user = new User(...);              // ❌ Bad
   ```

4. **Test Behavior, Not Implementation**
   ```php
   // ✅ Good
   test('can access protected route');
   
   // ❌ Bad
   test('method is protected');
   ```

5. **Test Both Success & Failure**
   ```php
   test('can login with correct password');
   test('cannot login with wrong password');
   ```

---

## 🔗 External Resources

- [Laravel Testing Docs](https://laravel.com/docs/testing)
- [Pest PHP](https://pestphp.com/)
- [PHPUnit](https://phpunit.de/)
- [Best Practices](https://laravel.com/docs/testing#best-practices)

---

## 📞 When Stuck

1. Check error message carefully
2. Search TESTING_GUIDE.md
3. Look at example tests in `tests/Feature/`
4. Add `--verbose` flag for more info
5. Google the error message
6. Ask in Laravel community

---

## 🎉 You've Got This!

```
If you can run: php artisan test
Then you can write tests!

If you can write one test:
Then you can write a hundred!

If you can get 50% coverage:
Then you can get 85%!

If you want 85% coverage:
Then you WILL get it!

YOU'VE GOT THIS! 🚀
```

---

## 📊 Coverage Tracker

Track this weekly:

```
Week 1: 0% → Manual testing phase
Week 2: 0% → 50% (20 tests)
Week 3: 50% → 80% (80 tests)
Week 4: 80% → 85% (100+ tests) ✅
```

Use command:
```bash
php artisan test --coverage
```

---

## 🗺️ Document Navigation

```
START HERE
    ↓
TESTING_SUMMARY.md (5 min)
    ↓
TESTING_QUICK_START.md (15 min)
    ↓
Choose Your Path:
├─ Testing UI? → MANUAL_TESTING_GUIDE.md
├─ Writing Tests? → TESTING_GUIDE.md
├─ Planning? → TESTING_IMPLEMENTATION_PLAN.md
└─ Need Help? → TESTING_DOCUMENTATION_INDEX.md
```

---

## ✨ Summary

```
3 Types of Testing
├─ Manual (You click)
├─ Automated (Code tests)
└─ E2E (Auto click)

10 Phases to Test
├─ Auth
├─ Student Portal
├─ Teacher Portal
├─ Admin Portal
├─ SuperAdmin Portal
├─ Profile/Universal
├─ Validation/Errors
├─ Database
├─ Performance
└─ Email/Notifications

4 Weeks to Complete
├─ Week 1: Manual
├─ Week 2: Auto start
├─ Week 3: Expand
└─ Week 4: Production ready 🚀

Goal: 85% Coverage + Zero Critical Bugs
```

---

**READY TO TEST? Start with:** `php artisan test` 🧪

