package tn.esprit.gamification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.gamification.dto.CatalogDtos.*;
import tn.esprit.gamification.entity.Avatar;
import tn.esprit.gamification.exception.ApiException;
import tn.esprit.gamification.mapper.GamificationMapper;
import tn.esprit.gamification.repository.AvatarRepository;
import tn.esprit.gamification.repository.EmblemRepository;

import java.util.List;

/** Catalogues : avatars, emblèmes, niveaux. */
@Service
@RequiredArgsConstructor
public class CatalogService {

    private final AvatarRepository avatarRepository;
    private final EmblemRepository emblemRepository;
    private final LevelService levelService;
    private final GamificationMapper mapper;

    @Transactional(readOnly = true)
    public List<AvatarDTO> avatars() {
        return avatarRepository.findByActiveTrueOrderByRequiredLevelAsc().stream().map(mapper::toDto).toList();
    }

    @Transactional
    public AvatarDTO createAvatar(AvatarRequest r) {
        if (avatarRepository.existsByCode(r.code())) {
            throw ApiException.conflict("Un avatar avec le code " + r.code() + " existe déjà");
        }
        Avatar saved = avatarRepository.save(Avatar.builder()
                .code(r.code())
                .label(r.label())
                .imageUrl(r.imageUrl())
                .requiredLevel(r.requiredLevel())
                .active(true)
                .build());
        return mapper.toDto(saved);
    }

    @Transactional
    public void deactivateAvatar(Long id) {
        avatarRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Avatar introuvable : " + id))
                .setActive(false);
    }

    @Transactional(readOnly = true)
    public List<EmblemDTO> emblems() {
        return emblemRepository.findAll().stream().map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<LevelDTO> levels() {
        return levelService.findAll().stream().map(mapper::toDto).toList();
    }
}
