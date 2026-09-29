package com.bizsmart.services;

import com.bizsmart.exceptions.ResourceNotFoundException;
import com.bizsmart.models.Expense;
import com.bizsmart.models.ExpenseCategory;
import com.bizsmart.payload.request.ExpenseRequest;
import com.bizsmart.repositories.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    @Transactional(readOnly = true)
    public List<Expense> list(LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return expenseRepository.findAllByOrderByExpenseDateDesc();
        }
        LocalDate start = from != null ? from : LocalDate.of(1970, 1, 1);
        LocalDate end = to != null ? to : LocalDate.now().plusYears(100);
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("'to' date must not be before 'from' date.");
        }
        return expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDesc(start, end);
    }

    @Transactional
    public Expense create(ExpenseRequest request) {
        Expense expense = new Expense(request.getTitle().trim(), request.getCategory(), request.getAmount(),
                request.getExpenseDate(), request.getNotes());
        return expenseRepository.save(expense);
    }

    @Transactional
    public Expense update(Long id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", id));
        expense.setTitle(request.getTitle().trim());
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        if (request.getExpenseDate() != null) expense.setExpenseDate(request.getExpenseDate());
        expense.setNotes(request.getNotes());
        return expenseRepository.save(expense);
    }

    @Transactional
    public void delete(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Expense", id);
        }
        expenseRepository.deleteById(id);
    }

    /** Totals per category plus a grand total for the given range. */
    @Transactional(readOnly = true)
    public Map<String, Object> summary(LocalDate from, LocalDate to) {
        Map<ExpenseCategory, BigDecimal> byCategory = new EnumMap<>(ExpenseCategory.class);
        BigDecimal total = BigDecimal.ZERO;
        for (Expense e : list(from, to)) {
            byCategory.merge(e.getCategory(), e.getAmount(), BigDecimal::add);
            total = total.add(e.getAmount());
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("from", from);
        result.put("to", to);
        result.put("total", total);
        result.put("byCategory", byCategory);
        return result;
    }
}
