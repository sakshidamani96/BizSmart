package com.bizsmart.repositories;

import com.bizsmart.models.DemandForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandForecastRepository extends JpaRepository<DemandForecast, Long> {
    List<DemandForecast> findByProductIdOrderByForecastDateDesc(Long productId);
    List<DemandForecast> findByReorderRecommendedTrue();
    List<DemandForecast> findAllByOrderByCreatedAtDesc();
}
