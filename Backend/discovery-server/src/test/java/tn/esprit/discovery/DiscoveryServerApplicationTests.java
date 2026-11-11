package tn.esprit.discovery;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DiscoveryServerApplicationTests {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void leTableauDeBordEurekaRepond() {
        ResponseEntity<String> page = rest.getForEntity("/", String.class);
        assertThat(page.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void leRegistreEstAccessible() {
        ResponseEntity<String> apps = rest.getForEntity("/eureka/apps", String.class);
        assertThat(apps.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void healthEstUp() {
        ResponseEntity<String> health = rest.getForEntity("/actuator/health", String.class);
        assertThat(health.getBody()).contains("UP");
    }
}
